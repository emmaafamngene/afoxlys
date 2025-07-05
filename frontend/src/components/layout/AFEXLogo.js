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
    if (!user) return 'U';
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return 'U';
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
      return 'from-gray-400 to-gray-600';
    }
    
    // Generate consistent colors based on username
    const colors = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-green-400 to-green-600',
      'from-yellow-400 to-yellow-600',
      'from-red-400 to-red-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600',
      'from-orange-400 to-orange-600',
      'from-cyan-400 to-cyan-600'
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