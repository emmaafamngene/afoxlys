import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiAward, FiCheck, FiX, FiStar, FiShield, FiZap, FiGift } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Premium = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  useEffect(() => {
    fetchPremiumStatus();
  }, []);

  const fetchPremiumStatus = async () => {
    try {
      const response = await fetch('/api/payments/premium/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setPremiumStatus(data);
      }
    } catch (error) {
      console.error('Error fetching premium status:', error);
    }
  };

  const handlePayment = async () => {
    if (!user?.email) {
      toast.error('Please login to purchase premium');
      return;
    }

    setLoading(true);
    try {
      // Initialize payment
      const response = await fetch('/api/payments/premium/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          plan: selectedPlan
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to Paystack payment page
        window.location.href = data.authorizationUrl;
      } else {
        toast.error(data.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '₦1,000',
      originalPrice: '₦1,500',
      period: 'month',
      popular: false,
      savings: '33% off'
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '₦10,000',
      originalPrice: '₦18,000',
      period: 'year',
      popular: true,
      savings: '44% off'
    }
  ];

  const features = [
    {
      icon: <FiX className="w-5 h-5" />,
      title: 'No Ads',
      description: 'Enjoy a completely ad-free experience'
    },
    {
      icon: <FiShield className="w-5 h-5" />,
      title: 'Private Stories',
      description: 'Share stories with select followers only'
    },
    {
      icon: <FiZap className="w-5 h-5" />,
      title: 'Boost Your Posts',
      description: 'Get 3x more visibility on your content'
    },
    {
      icon: <FiStar className="w-5 h-5" />,
      title: 'Premium Badge',
      description: 'Show off your premium status with a special badge'
    },
    {
      icon: <FiGift className="w-5 h-5" />,
      title: 'Exclusive Content',
      description: 'Access to premium-only features and content'
    },
    {
      icon: <FiAward className="w-5 h-5" />,
      title: 'Priority Support',
      description: 'Get faster response times from our support team'
    }
  ];

  if (premiumStatus?.isPremiumActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Premium Active Status */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6">
              <FiAward className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              You're Premium! 🎉
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Enjoy all the premium features
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">
                    {premiumStatus.premiumPlan}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {new Date(premiumStatus.premiumExpiresAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Days Left:</span>
                  <span className="font-semibold text-green-600">
                    {premiumStatus.daysUntilExpiry} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6">
            <FiAward className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Upgrade to Afex Premium
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock exclusive features, remove ads, and take your Afex experience to the next level
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 transition-all duration-200 ${
                selectedPlan === plan.id
                  ? 'border-purple-500 shadow-purple-100 dark:shadow-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">/{plan.period}</span>
                </div>
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <span className="text-gray-400 line-through">{plan.originalPrice}</span>
                  <span className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-1 rounded text-sm font-medium">
                    {plan.savings}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    selectedPlan === plan.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            What's Included
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Upgrade?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Join thousands of users who have already upgraded to Afex Premium
            </p>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Get Premium - ${plans.find(p => p.id === selectedPlan)?.price}/${plans.find(p => p.id === selectedPlan)?.period}`}
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Secure payment powered by Paystack • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium; 