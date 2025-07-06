import React from 'react';

const XPBar = ({ xp, level, progress, xpForNextLevel, xpForCurrentLevel, className = '' }) => {
  // Calculate XP needed for next level
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const xpInCurrentLevel = xp - xpForCurrentLevel;
  
  // Ensure progress is between 0 and 100
  const displayProgress = Math.min(100, Math.max(0, progress || 0));

  return (
    <div className={`flex flex-col items-start space-y-1 ${className}`}>
      {/* Level Display */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          ⭐ Level {level}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {xp} XP
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full">
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        
        {/* XP Progress Text */}
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {xpInCurrentLevel} / {xpNeeded} XP
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {displayProgress.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default XPBar; 