"use client"

import React, { useEffect, useState } from 'react';
import { CreditCard, Check, Star, Loader2, Users, Bell, BarChart3, Headphones, Palette, Zap } from 'lucide-react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const Subscription = () => {
  const { supabase } = useSupabase();
  const { loading: authLoading, clinic } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  // Feature icons mapping
  const featureIcons = {
    email_reminders: Bell,
    sms_reminders: Bell,
    whatsapp_reminders: Bell,
    ai_insights: BarChart3,
    basic_insights: BarChart3,
    advanced_analytics: BarChart3,
    support: Headphones,
    custom_integrations: Zap,
    white_label: Palette
  };

  // Format feature names for display
  const formatFeatureName = (key) => {
    const names = {
      email_reminders: 'Email Reminders',
      sms_reminders: 'SMS Reminders',
      whatsapp_reminders: 'WhatsApp Reminders',
      ai_insights: 'AI-Powered Insights',
      basic_insights: 'Basic Insights',
      advanced_analytics: 'Advanced Analytics',
      support: 'Support',
      custom_integrations: 'Custom Integrations',
      white_label: 'White Label Option'
    };
    return names[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format support level
  const formatSupportLevel = (level) => {
    const levels = {
      community: 'Community Support',
      email: 'Email Support',
      priority: 'Priority Support',
      dedicated: 'Dedicated Account Manager'
    };
    return levels[level] || level;
  };

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('Please log in to view subscription plans');
        }

        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        const plansRes = await fetch(`${base}/api/subscriptions/plans`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!plansRes.ok) {
          const planError = await plansRes.json().catch(() => ({}));
          throw new Error(planError.error || 'Failed to fetch plans');
        }

        const plansJson = await plansRes.json();
        setPlans(plansJson || []);
      } catch (e) {
        console.error('Fetch data error:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, authLoading]);

  const handleUpgrade = async (plan) => {
    try {
      setProcessingPlanId(plan.id);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please log in to upgrade your subscription');
      }

      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const response = await fetch(`${base}/api/subscriptions/initialize-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_period: billingPeriod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize payment');
      }

      const paymentData = await response.json();
      if (paymentData.authorization_url) {
        window.location.href = paymentData.authorization_url;
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
      setProcessingPlanId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600">
          Choose the plan that best fits your clinic's needs
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`px-6 py-2.5 rounded-lg border text-sm font-medium transition-all ${
            billingPeriod === 'monthly'
              ? 'bg-primary-600 text-white border-primary-600 shadow-md'
              : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
          }`}
        >
          Monthly Billing
        </button>
        <button
          onClick={() => setBillingPeriod('yearly')}
          className={`px-6 py-2.5 rounded-lg border text-sm font-medium transition-all relative ${
            billingPeriod === 'yearly'
              ? 'bg-primary-600 text-white border-primary-600 shadow-md'
              : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
          }`}
        >
          Yearly Billing
          <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
            Save 20%
          </span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.length === 0 ? (
          <div className="md:col-span-4 text-center py-12">
            <p className="text-gray-500 mb-4">No plans available</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary-600 hover:text-primary-800 underline"
            >
              Reload page
            </button>
          </div>
        ) : (
          plans.map((plan) => {
            const isCurrent = (clinic?.subscription_plan || 'free').toLowerCase() === plan.name?.toLowerCase();
            const isProcessing = processingPlanId === plan.id;
            const isPopular = plan.name === 'pro';
            const features = typeof plan.features === 'object' ? plan.features : {};

            // Calculate price
            const price = billingPeriod === 'yearly' ? plan.price_yearly : plan.price_monthly;
            const savings = billingPeriod === 'yearly' ? (plan.price_monthly * 12 - plan.price_yearly).toFixed(2) : 0;

            return (
              <div
                key={plan.id}
                className={`relative bg-white border-2 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all ${
                  isPopular ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
                } ${isCurrent ? 'bg-primary-50 border-primary-400' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-full text-center items-center">
                    <span className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center shadow-md">
                      <Star className="h-4 w-4 mr-1 fill-current" />
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-2 right-4">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.display_name}
                  </h3>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-extrabold text-gray-900">
                        ${price}
                      </span>
                      <span className="text-gray-600 ml-2">
                        /{billingPeriod === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                    {billingPeriod === 'yearly' && savings > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        Save ${savings}/year
                      </p>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{plan.max_patients === -1 ? 'Unlimited' : plan.max_patients} patients</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <Bell className="h-4 w-4 inline mr-1" />
                    {plan.max_reminders_per_month === -1 ? 'Unlimited' : plan.max_reminders_per_month} reminders/month
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {Object.entries(features).map(([key, value]) => {
                    const Icon = featureIcons[key] || Check;
                    const isSupport = key === 'support';
                    const displayValue = isSupport ? formatSupportLevel(value) : formatFeatureName(key);
                    
                    return (
                      <li key={key} className="flex items-start text-sm">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">
                          {displayValue}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrent || isProcessing || plan.name === 'free'}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center ${
                    isCurrent
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : isProcessing
                      ? 'bg-gray-400 text-white cursor-wait'
                      : plan.name === 'free'
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : isPopular
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-md'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : plan.name === 'free' ? (
                    'Free Forever'
                  ) : (
                    'Upgrade Now'
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Info */}
      <div className="card bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
        <div className="flex items-start space-x-4">
          <CreditCard className="h-6 w-6 text-gray-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Secure Payment Information
            </h3>
            <p className="text-gray-700 mb-3">
              All plans are billed in <strong>USD</strong>. Payment is processed securely through Paystack. 
              Nigerian users will see charges automatically converted to NGN at checkout.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>Secure SSL encryption</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>Cancel anytime, no hidden fees</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>Instant activation after payment</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      {/* <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Can I change plans later?</h4>
            <p className="text-sm text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">What happens if I exceed my limits?</h4>
            <p className="text-sm text-gray-600">
              You'll be notified when you're approaching your limits. You can upgrade to a higher plan to continue without interruption.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Is there a free trial?</h4>
            <p className="text-sm text-gray-600">
              The Free plan is available forever with limited features. You can test the platform before upgrading.
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Subscription;