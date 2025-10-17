import React, { useEffect, useState } from 'react';
import { CreditCard, Check, Star } from 'lucide-react';
import { useSupabase } from '../../contexts/SupabaseContext';
import LoadingSpinner from '../common/LoadingSpinner';

const Subscription = () => {
  const { supabase } = useSupabase();
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const [plansRes, currentRes] = await Promise.all([
          fetch(`${base}/api/subscriptions/plans`),
          fetch(`${base}/api/subscriptions/current`, { headers: { Authorization: `Bearer ${session?.access_token}` } })
        ]);
        if (!plansRes.ok) throw new Error('Failed to fetch plans');
        if (!currentRes.ok) throw new Error('Failed to fetch current subscription');
        const plansJson = await plansRes.json();
        const currentJson = await currentRes.json();
        setPlans(plansJson || []);
        setCurrent(currentJson?.clinic || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600">Choose the plan that best fits your clinic's needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="md:col-span-2 lg:col-span-4 py-12 text-center"><LoadingSpinner /></div>
        ) : error ? (
          <div className="md:col-span-2 lg:col-span-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        ) : plans.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-4 text-center py-12">No plans available</div>
        ) : plans.map((plan) => (
          <div
            key={plan.name}
            className={`card relative ${
              plan.is_popular ? 'ring-2 ring-primary-500' : ''
            } ${(current?.subscription_plan || 'free').toLowerCase() === plan.name?.toLowerCase() ? 'bg-primary-50' : ''}`}
          >
            {plan.is_popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Popular
                </span>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.display_name || plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">${plan.price_monthly}</span>
                <span className="text-gray-600">/month</span>
              </div>
              
              <ul className="space-y-2 mb-6">
                {(plan.features || []).map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  (current?.subscription_plan || 'free').toLowerCase() === plan.name?.toLowerCase()
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : plan.is_popular
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
                disabled={(current?.subscription_plan || 'free').toLowerCase() === plan.name?.toLowerCase()}
              >
                {(current?.subscription_plan || 'free').toLowerCase() === plan.name?.toLowerCase() ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
        <p className="text-gray-600 mb-4">All plans are billed monthly. Payment is processed securely through Paystack.</p>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CreditCard className="h-4 w-4" />
          <span>Secure payment processing</span>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
