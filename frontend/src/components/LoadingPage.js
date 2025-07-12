import React, { useState, useEffect } from 'react';

export default function LoadingPage({ darkMode = false }) {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Show welcome message after a short delay
    const welcomeTimer = setTimeout(() => {
      setShowWelcome(true);
    }, 500);

    return () => {
      clearTimeout(welcomeTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center z-50">
      <div className="flex flex-col items-center justify-center space-y-8 w-full h-full">
        {/* AFEX Logo with enhanced pulse animation */}
        <div className="animate-pulse-slow transform hover:scale-105 transition-transform duration-300 flex items-center justify-center ml-24">
          <img 
            src="/best.png"
            alt="AFEX Logo" 
            className="h-48 w-auto drop-shadow-2xl"
            style={{
              filter: 'brightness(1.1) contrast(1.2)',
              mixBlendMode: 'multiply'
            }}
          />
        </div>
        
        {/* Welcome Message with Animation */}
        <div className="text-center space-y-4">
          <div className={`transition-all duration-1000 transform ${
            showWelcome ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome to AFEX
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Your social media experience awaits
            </p>
          </div>
          
          {/* User Name with Typing Animation */}
  
        </div>
        
        {/* Enhanced Loading Spinner */}
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* Loading text with gradient */}
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">
          Loading your personalized experience...
        </p>
      </div>
    </div>
  );
} 