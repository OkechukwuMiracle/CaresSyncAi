import React, { useEffect, useState } from 'react';
import { CreditCard, Check, X, Star, Loader2 } from 'lucide-react';
import { useSupabase } from '../../contexts/SupabaseContext';
import LoadingSpinner from '../common/LoadingSpinner';

const Subscription = () => {
  const { supabase } = useSupabase();
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  // ✅ Helper to parse features whether JSON or array
  const parseFeatures = (features) => {
    try {
      if (!features) return {};
      if (typeof features === 'object') return features;
      if (typeof features === 'string') {
        const parsed = JSON.parse(features);
        return typeof parsed === 'object' ? parsed : {};
      }
      return {};
    } catch (e) {
      console.error('Feature parse error:', e);
      return {};
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) throw new Error('No active session');

        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        const [plansRes, currentRes] = await Promise.all([
          fetch(`${base}/api/subscriptions/plans`),
          fetch(`${base}/api/subscriptions/current`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
        ]);

        if (!plansRes.ok) throw new Error('Failed to fetch plans');
        if (!currentRes.ok) throw new Error('Failed to fetch current subscription');

        const plansJson = await plansRes.json();
        const currentJson = await currentRes.json();

        const parsedPlans = (plansJson || []).map((plan) => ({
          ...plan,
          features: parseFeatures(plan.features),
        }));

        setPlans(parsedPlans);
        setCurrent(currentJson?.clinic || null);
      } catch (e) {
        console.error('Fetch data error:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [supabase]);

  // ✅ Handle payment
  const handleUpgrade = async (plan) => {
    try {
      setProcessingPlanId(plan.id);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No active session');

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

  // ✅ UI Rendering
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600">
          Choose the plan that best fits your clinic’s needs — prices are in USD
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`px-4 py-2 rounded-lg border text-sm font-medium ${
            billingPeriod === 'monthly'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          Monthly Billing
        </button>
        <button
          onClick={() => setBillingPeriod('yearly')}
          className={`px-4 py-2 rounded-lg border text-sm font-medium ${
            billingPeriod === 'yearly'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          Yearly Billing (Save 20%)
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="md:col-span-4 py-12 text-center">
            <LoadingSpinner />
          </div>
        ) : plans.length === 0 ? (
          <div className="md:col-span-4 text-center py-12">No plans available</div>
        ) : (
          plans.map((plan) => {
            const isCurrent =
              (current?.subscription_plan || 'free').toLowerCase() ===
              plan.name?.toLowerCase();
            const isProcessing = processingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition ${
                  plan.is_popular ? 'ring-2 ring-blue-500' : ''
                } ${isCurrent ? 'bg-blue-50' : ''}`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {plan.display_name || plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      ${billingPeriod === 'yearly' ? plan.price_yearly : plan.price_monthly}
                    </span>
                    <span className="text-gray-600">
                      /{billingPeriod === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>

                  {/* ✅ Dynamic Features */}
                  <ul className="space-y-2 mb-6 text-left">
                    {Object.keys(plan.features).length > 0 ? (
                      Object.entries(plan.features).map(([key, val]) => (
                        <li key={key} className="flex items-center text-sm text-gray-700">
                          {val ? (
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <X className="h-4 w-4 text-red-400 mr-2" />
                          )}
                          <span className="capitalize">
                            {key.replace(/_/g, ' ')}{' '}
                            {typeof val === 'number' ? `(${val})` : ''}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500 italic">
                        No features listed
                      </li>
                    )}
                  </ul>

                  {/* ✅ Buttons */}
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={isCurrent || isProcessing}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                      isCurrent
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : isProcessing
                        ? 'bg-gray-400 text-white cursor-wait'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : (
                      'Upgrade'
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Information
        </h3>
        <p className="text-gray-600 mb-4">
          All plans are billed in <b>USD</b>. Payment is processed securely through Paystack (converted to NGN automatically).
        </p>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CreditCard className="h-4 w-4" />
          <span>Secure payment processing</span>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
