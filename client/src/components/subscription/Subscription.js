import React from 'react';
import { CreditCard, Check, Star } from 'lucide-react';

const Subscription = () => {
  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'month',
      features: [
        'Up to 10 patients',
        '50 reminders per month',
        'Email reminders',
        'Basic AI insights',
        'Community support'
      ],
      current: true,
      popular: false
    },
    {
      name: 'Basic',
      price: 19,
      period: 'month',
      features: [
        'Up to 100 patients',
        '500 reminders per month',
        'Email & SMS reminders',
        'AI insights & analytics',
        'Email support'
      ],
      current: false,
      popular: true
    },
    {
      name: 'Pro',
      price: 49,
      period: 'month',
      features: [
        'Up to 500 patients',
        '2,000 reminders per month',
        'Email, SMS & WhatsApp',
        'Advanced analytics',
        'Priority support'
      ],
      current: false,
      popular: false
    },
    {
      name: 'Enterprise',
      price: 99,
      period: 'month',
      features: [
        'Unlimited patients',
        'Unlimited reminders',
        'All communication channels',
        'Custom integrations',
        'Dedicated support',
        'White-label options'
      ],
      current: false,
      popular: false
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600">Choose the plan that best fits your clinic's needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`card relative ${
              plan.popular ? 'ring-2 ring-primary-500' : ''
            } ${plan.current ? 'bg-primary-50' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Popular
                </span>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>
              
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  plan.current
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : plan.popular
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
                disabled={plan.current}
              >
                {plan.current ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
        <p className="text-gray-600 mb-4">
          All plans are billed monthly. You can upgrade or downgrade at any time. 
          Payment is processed securely through Paystack.
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
