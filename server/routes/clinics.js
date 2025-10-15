const express = require('express');
const supabase = require('../config/database');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

// Get clinic dashboard overview
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const clinicId = req.clinic.id;

    // Get patient count
    const { count: patientCount, error: patientError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    if (patientError) {
      return res.status(400).json({ error: patientError.message });
    }

    // Get upcoming follow-ups (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const { data: upcomingFollowUps, error: followUpError } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .not('next_follow_up_date', 'is', null)
      .lte('next_follow_up_date', nextWeekStr)
      .order('next_follow_up_date', { ascending: true });

    if (followUpError) {
      return res.status(400).json({ error: followUpError.message });
    }

    // Get pending reminders
    const { count: pendingReminders, error: reminderError } = await supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('status', 'pending');

    if (reminderError) {
      return res.status(400).json({ error: reminderError.message });
    }

    // Get recent responses
    const { data: recentResponses, error: responseError } = await supabase
      .from('patient_responses')
      .select(`
        *,
        patients (
          id,
          name
        )
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (responseError) {
      return res.status(400).json({ error: responseError.message });
    }

    // Get urgent cases
    const { data: urgentCases, error: urgentError } = await supabase
      .from('patient_responses')
      .select(`
        *,
        patients (
          id,
          name,
          phone,
          email
        )
      `)
      .eq('clinic_id', clinicId)
      .eq('ai_status', 'Urgent')
      .order('created_at', { ascending: false })
      .limit(5);

    if (urgentError) {
      return res.status(400).json({ error: urgentError.message });
    }

    // Get today's insights
    const today = new Date().toISOString().split('T')[0];
    const { data: todayInsight, error: insightError } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('date', today)
      .single();

    const dashboard = {
      overview: {
        totalPatients: patientCount,
        upcomingFollowUps: upcomingFollowUps.length,
        pendingReminders,
        urgentCases: urgentCases.length
      },
      todayInsights: todayInsight || {
        total_responses: 0,
        fine_count: 0,
        mild_issue_count: 0,
        urgent_count: 0
      },
      upcomingFollowUps,
      recentResponses,
      urgentCases
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get clinic statistics
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const clinicId = req.clinic.id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get patient statistics
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('created_at, is_active')
      .eq('clinic_id', clinicId);

    if (patientError) {
      return res.status(400).json({ error: patientError.message });
    }

    // Get reminder statistics
    const { data: reminders, error: reminderError } = await supabase
      .from('reminders')
      .select('status, contact_method, created_at')
      .eq('clinic_id', clinicId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (reminderError) {
      return res.status(400).json({ error: reminderError.message });
    }

    // Get response statistics
    const { data: responses, error: responseError } = await supabase
      .from('patient_responses')
      .select('ai_status, created_at')
      .eq('clinic_id', clinicId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (responseError) {
      return res.status(400).json({ error: responseError.message });
    }

    const stats = {
      period,
      patients: {
        total: patients.length,
        active: patients.filter(p => p.is_active).length,
        newThisPeriod: patients.filter(p => new Date(p.created_at) >= startDate).length
      },
      reminders: {
        total: reminders.length,
        sent: reminders.filter(r => r.status === 'sent').length,
        pending: reminders.filter(r => r.status === 'pending').length,
        failed: reminders.filter(r => r.status === 'failed').length,
        byMethod: {
          email: reminders.filter(r => r.contact_method === 'email').length,
          sms: reminders.filter(r => r.contact_method === 'sms').length,
          whatsapp: reminders.filter(r => r.contact_method === 'whatsapp').length
        }
      },
      responses: {
        total: responses.length,
        fine: responses.filter(r => r.ai_status === 'Fine').length,
        mild: responses.filter(r => r.ai_status === 'Mild issue').length,
        urgent: responses.filter(r => r.ai_status === 'Urgent').length
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
