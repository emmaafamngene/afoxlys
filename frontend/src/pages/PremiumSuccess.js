import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiCheck, FiAward, FiStar, FiShield, FiZap, FiGift, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PremiumSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [premiumData, setPremiumData] = useState(null);

  useEffect(() => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    
    if (reference || trxref) {
      verifyPayment(reference || trxref);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const verifyPayment = async (reference) => {
    try {
      const response = await fetch('/api/payments/premium/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reference })
      });

      const data = await response.json();
      
      if (data.success) {
        setPremiumData(data);
        toast.success('Premium upgrade successful! 🎉');
        
        // Update user context if needed
        if (updateUser) {
          updateUser(data.user);
        }
      } else {
        toast.error(data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <FiCheck className="w-5 h-5" />,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-6 animate-pulse">
            <FiCheck className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Premium! 🎉
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Your payment was successful and your premium features are now active
          </p>
          
          {/* Premium Details */}
          {premiumData && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md mx-auto mb-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">
                    {premiumData.premiumPlan || 'Premium'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {premiumData.premiumExpiresAt ? 
                      new Date(premiumData.premiumExpiresAt).toLocaleDateString() : 
                      'Active'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="font-semibold text-green-600">
                    Active ✅
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Your Premium Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
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

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <span>Start Exploring</span>
            <FiArrowRight className="w-5 h-5" />
          </button>
          
          <div className="space-x-4">
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              View Profile
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Settings
            </button>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-12 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Thank you for choosing AFEX Premium! 🚀
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You now have access to all premium features. Enjoy an enhanced experience with no ads, 
              exclusive content, and priority support.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              If you have any questions, feel free to reach out to our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumSuccess; 