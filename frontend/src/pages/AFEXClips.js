import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { FiVideo, FiTarget, FiUsers, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AFEXClips = () => {
  const { isAuthenticated, user } = useAuth();
  const [fundraisingStats, setFundraisingStats] = useState({
    goal: 100,
    current: 0,
    progress: 0,
    totalDonations: 0,
    donorCount: 0
  });

  usePageTitle('AFEXClips - Temporarily Closed');

  const handleSupportClick = () => {
    const moniepointAccount = '1234567890';
    const accountName = 'AFEX Donations';
    
    // Copy account number to clipboard
    navigator.clipboard.writeText(moniepointAccount).then(() => {
      toast.success('Moniepoint account copied to clipboard!');
    });
    
    // Show alert with payment instructions
    alert(`Please send your donation to:\n\nMoniepoint Account: ${moniepointAccount}\nAccount Name: ${accountName}\n\nAfter payment, please contact us with your name and email for confirmation.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-2xl">
            <FiVideo className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 sm:mb-4 px-2">
            AFEXClips Temporarily Closed
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
            We're working hard to bring you an amazing video experience, but we need your help to get there!
          </p>
        </div>

        {/* Fundraising Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
              <FiTarget className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Fundraising Goal</h2>
            </div>
            <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-1 sm:mb-2">$100</div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Target to Reopen AFEXClips</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Current Progress</span>
              <span>${fundraisingStats.current} / ${fundraisingStats.goal}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 sm:h-4">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 sm:h-4 rounded-full transition-all duration-500"
                style={{ width: `${fundraisingStats.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Moniepoint Payment Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              Support via Moniepoint
            </h3>

            {/* Moniepoint Account Info */}
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-blue-200 dark:border-blue-700">
              <div className="text-center">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Moniepoint Account Details</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 block">Account Number:</span>
                    <div className="font-mono text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 break-all">1234567890</div>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 block">Account Name:</span>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">AFEX Donations</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Button */}
            <div className="text-center">
              <button
                onClick={handleSupportClick}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 sm:py-3 px-6 sm:px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation"
              >
                Copy Account & Get Instructions
              </button>
            </div>
          </div>

          {/* Why We Need Funding */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">
              Why We Need Your Support
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg sm:rounded-xl">
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0">
                  <FiZap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">Server Infrastructure</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
                    High-performance servers to handle video streaming and storage for all users.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg sm:rounded-xl">
                <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900 rounded-full flex-shrink-0">
                  <FiUsers className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">User Experience</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
                    Smooth video playback, fast loading times, and reliable service for everyone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">📋 How to Donate:</h4>
            <ol className="list-decimal list-inside space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <li>Click "Copy Account & Get Instructions" above</li>
              <li>Open your Moniepoint app</li>
              <li>Send your donation to the account number</li>
              <li>Contact us with your name and email for confirmation</li>
              <li>We'll update the progress bar once confirmed</li>
            </ol>
          </div>
        </div>

        {/* Alternative Actions */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
            While we work on reopening AFEXClips, you can still:
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a
              href="/"
              className="inline-flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              <FiVideo className="w-4 h-4" />
              <span>Create Posts</span>
            </a>
            <a
              href="/chat"
              className="inline-flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              <FiUsers className="w-4 h-4" />
              <span>Connect with Friends</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AFEXClips; 