import React from 'react';

const AFEXLogo = ({ className = '', darkMode = false }) => {
  return (
    <img
      src={darkMode ? "/logo1.png" : "/logo.png"}
      alt="AFEX Logo"
      className={className}
    />
  );
};

// Default Avatar Component
export const DefaultAvatar = ({ user, size = 'md', className = '' }) => {
  const getInitials = (user) => {
    if (!user) return 'AF';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return 'AF';
  };

  const getSizeClasses = (size) => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'md':
        return 'w-10 h-10 text-base';
      case 'lg':
        return 'w-12 h-12 text-lg';
      case 'xl':
        return 'w-16 h-16 text-xl';
      default:
        return 'w-10 h-10 text-base';
    }
  };

  const getGradientColors = (user) => {
    if (!user || !user.username) {
      return ['#6B7280', '#9CA3AF'];
    }
    
    const colors = [
      ['#FF6B6B', '#4ECDC4'], // Red to Teal
      ['#45B7D1', '#96CEB4'], // Blue to Green
      ['#FFEAA7', '#DDA0DD'], // Yellow to Plum
      ['#A8E6CF', '#DCEDC8'], // Mint to Light Green
      ['#FFB3BA', '#BAFFC9'], // Pink to Light Green
      ['#BAE1FF', '#FFB3BA'], // Light Blue to Pink
      ['#FFD93D', '#FF6B6B'], // Yellow to Red
      ['#6C5CE7', '#A29BFE'], // Purple to Light Purple
      ['#00B894', '#00CEC9'], // Green to Cyan
      ['#FDCB6E', '#E17055'], // Orange to Red Orange
    ];
    
    const index = user.username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div 
      className={`${getSizeClasses(size)} ${className} rounded-full bg-gradient-to-br ${getGradientColors(user)} flex items-center justify-center text-white font-bold shadow-lg border-2 border-white dark:border-gray-800`}
      title={user ? `${user.firstName} ${user.lastName}` : 'User'}
    >
      {getInitials(user)}
    </div>
  );
};

export default AFEXLogo; 