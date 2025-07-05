import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { 
  FiVideo, FiPlus, FiHeart, FiMessageCircle, FiShare, FiPlay, 
  FiBookmark, FiVolume2, FiVolumeX, FiX, FiDollarSign, FiTarget, FiUsers, FiZap, FiCreditCard, FiMail, FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AFEXClips = () => {
  const { isAuthenticated, user } = useAuth();
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState(10);
  const [donorName, setDonorName] = useState(user?.firstName ? `${user.firstName} ${user.lastName}` : '');
  const [donorEmail, setDonorEmail] = useState(user?.email || '');
  const [donorMessage, setDonorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  usePageTitle('AFEXClips - Temporarily Closed');

  const handleDonate = () => {
    setShowDonationModal(true);
  };

  const handlePayment = async () => {
    if (!donorName.trim() || !donorEmail.trim()) {
      toast.error('Please fill in your name and email');
      return;
    }

    if (donationAmount < 1) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    setIsProcessing(true);

    try {
      // Create PayPal payment
      const response = await fetch('/api/clips/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: donationAmount,
          name: donorName,
          email: donorEmail,
          message: donorMessage
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to PayPal or show payment form
        const paypalUrl = `https://www.paypal.com/donate/?hosted_button_id=YOUR_PAYPAL_BUTTON_ID&amount=${donationAmount}&currency_code=USD&item_name=AFEXClips%20Fundraising`;
        
        // Open PayPal in new window
        window.open(paypalUrl, '_blank');
        
        toast.success('Thank you for your support! Redirecting to payment...');
        setShowDonationModal(false);
        setDonorMessage('');
      } else {
        toast.error(data.message || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const presetAmounts = [5, 10, 25, 50, 100];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-6 shadow-2xl">
            <FiVideo className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            AFEXClips Temporarily Closed
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            We're working hard to bring you an amazing video experience, but we need your help to get there!
          </p>
        </div>

        {/* Fundraising Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <FiTarget className="w-8 h-8 text-green-600" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Fundraising Goal</h2>
            </div>
            <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-xl p-6 mb-6">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">$100</div>
              <p className="text-gray-600 dark:text-gray-400">Target to Reopen AFEXClips</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Current Progress</span>
              <span>$0 / $100</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500" style={{ width: '0%' }}></div>
            </div>
          </div>

          {/* Why We Need Funding */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Why We Need Your Support
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <FiZap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Server Infrastructure</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    High-performance servers to handle video streaming and storage for all users.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <FiUsers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">User Experience</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Smooth video playback, fast loading times, and reliable service for everyone.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <FiVideo className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Video Processing</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Advanced video compression and optimization for better quality and faster uploads.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-full">
                  <FiDollarSign className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Payment System</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Secure payment processing and subscription management for premium features.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <button
              onClick={handleDonate}
              className="btn btn-primary text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-3 mx-auto"
            >
              <FiDollarSign className="w-6 h-6" />
              <span>Support AFEXClips</span>
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Every contribution helps us bring AFEXClips back to life!
            </p>
          </div>
        </div>

        {/* Alternative Actions */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            While we work on reopening AFEXClips, you can still:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="btn btn-secondary flex items-center space-x-2"
            >
              <FiPlus className="w-4 h-4" />
              <span>Create Posts</span>
            </Link>
            <Link
              to="/chat"
              className="btn btn-secondary flex items-center space-x-2"
            >
              <FiMessageCircle className="w-4 h-4" />
              <span>Connect with Friends</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Support AFEXClips</h3>
              <button
                onClick={() => setShowDonationModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Donation Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Donation Amount
              </label>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDonationAmount(amount)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      donationAmount === amount
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter amount"
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            {/* Donor Information */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiUser className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiMail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={donorMessage}
                  onChange={(e) => setDonorMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Leave a message of support..."
                  rows="3"
                />
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing || !donorName.trim() || !donorEmail.trim() || donationAmount < 1}
              className="w-full btn btn-primary text-lg py-4 rounded-xl flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FiCreditCard className="w-6 h-6" />
                  <span>Pay ${donationAmount} via PayPal</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              Secure payment processed by PayPal. Your information is protected.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AFEXClips; 