import React, { useState, useEffect } from 'react';

const LevelUpNotification = ({ levelUp, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (levelUp) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onClose();
        }, 500);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [levelUp, onClose]);

  if (!levelUp || !isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`
        bg-gradient-to-r from-yellow-400 to-orange-500 
        text-white p-4 rounded-lg shadow-lg 
        transform transition-all duration-500 ease-out
        ${isAnimating ? 'scale-100 translate-x-0' : 'scale-95 translate-x-full'}
      `}>
        {/* Level Up Header */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">🎉</span>
          <h3 className="font-bold text-lg">Level Up!</h3>
        </div>
        
        {/* Level Info */}
        <div className="space-y-1">
          <p className="text-sm">
            Congratulations! You reached <span className="font-bold">Level {levelUp.newLevel}</span>
          </p>
          <p className="text-xs opacity-90">
            +{levelUp.xpGained} XP • Total: {levelUp.totalXP} XP
          </p>
        </div>
        
        {/* Progress to next level */}
        <div className="mt-3">
          <div className="w-full h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-1000"
              style={{ width: `${levelUp.progress}%` }}
            />
          </div>
          <p className="text-xs mt-1 opacity-90">
            {levelUp.progress.toFixed(1)}% to Level {levelUp.newLevel + 1}
          </p>
        </div>
        
        {/* Close button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 500);
          }}
          className="absolute top-2 right-2 text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default LevelUpNotification; 