const express = require('express');
const supabase = require('../config/database');
const { authenticateUser } = require('../middleware/auth');
const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
const router = express.Router();

// Get all subscription plans
router.get('/plans', async (req, res) => {
  try {
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Get current clinic subscription
router.get('/current', authenticateUser, async (req, res) => {
  try {
    // Add logging to debug
    console.log('User:', req.user?.email);
    console.log('Clinic ID:', req.clinic?.id);
    
    if (!req.clinic?.id) {
      return res.status(400).json({ error: 'Clinic ID not found in request' });
    }

    // First, get the clinic without the join to see if that works
    const { data: clinic, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', req.clinic.id)
      .single();

    if (error) {
      console.error('Clinic query error:', error);
      return res.status(400).json({ error: error.message });
    }

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    // Get the subscription plan separately if it exists
    let subscriptionPlan = null;
    if (clinic.subscription_plan) {
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', clinic.subscription_plan)
        .single();
      
      if (!planError && plan) {
        subscriptionPlan = plan;
      }
    }

    // Get payment history
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('clinic_id', req.clinic.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (paymentsError) {
      console.error('Payments query error:', paymentsError);
      // Don't fail the whole request if payments fail
    }

    res.json({
      clinic: {
        ...clinic,
        subscription_plans: subscriptionPlan
      },
      payments: payments || []
    });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch current subscription' });
  }
});

// Initialize payment for subscription upgrade
router.post('/initialize-payment', authenticateUser, async (req, res) => {
  try {
    const { plan_id, billing_period = 'monthly' } = req.body;

    if (!plan_id) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Use USD pricing
    const amountUSD = billing_period === 'yearly' ? plan.price_yearly : plan.price_monthly;

    // Convert to NGN for Paystack (temporary workaround)
    const conversionRate = parseFloat(process.env.USD_TO_NGN || '1600');
    const amountNGN = amountUSD * conversionRate;
    const amountInKobo = Math.round(amountNGN * 100);

    const startDate = new Date();
    const endDate = new Date();
    billing_period === 'yearly'
      ? endDate.setFullYear(startDate.getFullYear() + 1)
      : endDate.setMonth(startDate.getMonth() + 1);

    const paymentData = {
      email: req.clinic.email,
      amount: amountInKobo,
      currency: 'NGN', // Paystack only accepts NGN
      reference: `caresync_${req.clinic.id}_${Date.now()}`,
      metadata: {
        clinic_id: req.clinic.id,
        plan_id,
        billing_period,
        plan_name: plan.name,
        amount_usd: amountUSD
      },
      callback_url: `${process.env.CLIENT_URL}/subscription/callback`,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
    };

    const response = await Paystack.transaction.initialize(paymentData);

    if (!response.status) {
      return res.status(400).json({ error: 'Failed to initialize payment' });
    }

    // Save in USD
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        clinic_id: req.clinic.id,
        plan_id,
        amount: amountUSD,
        currency: 'USD',
        payment_method: 'paystack',
        external_payment_id: response.data.reference,
        status: 'pending',
        billing_period_start: startDate.toISOString().split('T')[0],
        billing_period_end: endDate.toISOString().split('T')[0]
      })
      .select()
      .single();

    if (paymentError) {
      return res.status(400).json({ error: paymentError.message });
    }

    res.json({
      authorization_url: response.data.authorization_url,
      access_code: response.data.access_code,
      reference: response.data.reference,
      payment_id: payment.id
    });
  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});


// Verify payment and update subscription
router.post('/verify-payment', authenticateUser, async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Payment reference is required' });
    }

    // Verify payment with Paystack
    const response = await Paystack.transaction.verify(reference);

    if (!response.status) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const paymentData = response.data;

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('external_payment_id', reference)
      .eq('clinic_id', req.clinic.id)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    // Update payment status
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: paymentData.status === 'success' ? 'completed' : 'failed'
      })
      .eq('id', payment.id);

    if (updatePaymentError) {
      return res.status(400).json({ error: updatePaymentError.message });
    }

    if (paymentData.status === 'success') {
      // Update clinic subscription
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', payment.plan_id)
        .single();

      if (planError) {
        return res.status(400).json({ error: planError.message });
      }

      const { error: updateClinicError } = await supabase
        .from('clinics')
        .update({
          subscription_plan: plan.name,
          subscription_status: 'active',
          subscription_start_date: payment.billing_period_start,
          subscription_end_date: payment.billing_period_end,
          max_patients: plan.max_patients
        })
        .eq('id', req.clinic.id);

      if (updateClinicError) {
        return res.status(400).json({ error: updateClinicError.message });
      }
    }

    res.json({
      message: 'Payment verified successfully',
      status: paymentData.status,
      payment: {
        ...payment,
        status: paymentData.status === 'success' ? 'completed' : 'failed'
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Cancel subscription
router.post('/cancel', authenticateUser, async (req, res) => {
  try {
    const { reason } = req.body;

    // Update clinic subscription status
    const { error } = await supabase
      .from('clinics')
      .update({
        subscription_status: 'cancelled',
        subscription_plan: 'free',
        max_patients: 10
      })
      .eq('id', req.clinic.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Subscription cancelled successfully',
      reason: reason || 'No reason provided'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get payment history
router.get('/payments', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data: payments, error, count } = await supabase
      .from('payments')
      .select(`
        *,
        subscription_plans (
          name,
          display_name
        )
      `)
      .eq('clinic_id', req.clinic.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Get usage statistics
router.get('/usage', authenticateUser, async (req, res) => {
  try {
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', req.clinic.subscription_plan)
      .single();

    if (planError) {
      return res.status(400).json({ error: planError.message });
    }

    // Get current usage
    const { count: patientCount, error: patientError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', req.clinic.id)
      .eq('is_active', true);

    if (patientError) {
      return res.status(400).json({ error: patientError.message });
    }

    // Get monthly reminder count
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const { count: reminderCount, error: reminderError } = await supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', req.clinic.id)
      .gte('created_at', startOfMonth.toISOString());

    if (reminderError) {
      return res.status(400).json({ error: reminderError.message });
    }

    const usage = {
      plan: {
        name: plan.name,
        display_name: plan.display_name,
        max_patients: plan.max_patients,
        max_reminders_per_month: plan.max_reminders_per_month
      },
      current: {
        patients: patientCount,
        reminders_this_month: reminderCount
      },
      limits: {
        patients_remaining: plan.max_patients === -1 ? -1 : Math.max(0, plan.max_patients - patientCount),
        reminders_remaining: plan.max_reminders_per_month === -1 ? -1 : Math.max(0, plan.max_reminders_per_month - reminderCount)
      }
    };

    res.json(usage);
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics' });
  }
});

module.exports = router;
