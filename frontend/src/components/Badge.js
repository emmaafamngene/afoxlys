import React from 'react';

const Badge = ({ badge, size = 'md' }) => {
  const badgeConfig = {
    'Hot Shot': {
      icon: '🔥',
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      description: 'Received 50+ 🔥 votes on posts'
    },
    'Deep Soul': {
      icon: '😶',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      description: 'Posted 10+ confessions'
    },
    'Vibe Starter': {
      icon: '💬',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      description: 'Received 20+ reactions on confessions'
    },
    'Top Dog': {
      icon: '🏆',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      description: 'Weekly leaderboard #1'
    },
    'Swipe Master': {
      icon: '👆',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      description: 'Voted on 100+ posts'
    },
    'Confession King': {
      icon: '👑',
      color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      description: 'Posted 50+ confessions'
    },
    'Reaction Queen': {
      icon: '💖',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      description: 'Gave 100+ reactions'
    },
    'Trending Star': {
      icon: '⭐',
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      description: 'Had 5+ trending confessions'
    }
  };

  const config = badgeConfig[badge.badgeName] || {
    icon: badge.icon || '🏅',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    description: badge.description || 'Achievement unlocked!'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full font-medium ${config.color} ${sizeClasses[size]}`}>
      <span className="text-lg">{config.icon}</span>
      <span>{badge.badgeName}</span>
    </div>
  );
};

export default Badge; 