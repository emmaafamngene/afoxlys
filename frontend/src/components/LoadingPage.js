import React from 'react';
import AFEXLogo from './layout/AFEXLogo';

export default function LoadingPage({ darkMode = false }) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-6">
        {/* AFOXLY Logo with pulse animation - larger size */}
        <div className="animate-pulse">
          <img 
            src={darkMode ? "/logo1.png" : "/logo.png"}
            alt="AFOXLY Logo" 
            className="h-48 w-auto mx-auto"
            style={{
              filter: 'brightness(1.1) contrast(1.2)',
              mixBlendMode: 'multiply'
            }}
          />
        </div>
        
        {/* Loading spinner */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* Loading text */}
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          Loading AFOXLY...
        </p>
      </div>
    </div>
  );
} 