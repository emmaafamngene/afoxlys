import React from 'react';

export default function AFEXLogo({ className = '', darkMode = false }) {
  return (
    <img 
      src={darkMode ? "/logo1.png" : "/logo.png"} 
      alt="AFOXLY Logo" 
      className={`h-8 w-auto ${className}`}
    />
  );
}

// Default Avatar Component
export function DefaultAvatar({ 
  user, 
  size = 'md', 
  className = '',
  showOnline = false 
}) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl'
  };

  const getInitials = (user) => {
    if (!user) return 'U';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const username = user.username || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (username) {
      return username.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  const getBackgroundColor = (user) => {
    if (!user || !user.username) return 'bg-gray-500';
    
    // Generate consistent color based on username
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
    ];
    
    const index = user.username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div className={`
        ${sizeClasses[size]} 
        ${getBackgroundColor(user)}
        rounded-full 
        flex 
        items-center 
        justify-center 
        text-white 
        font-semibold 
        shadow-sm 
        border-2 
        border-white 
        dark:border-gray-800
      `}>
        {getInitials(user)}
      </div>
      
      {/* Online indicator */}
      {showOnline && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm"></div>
      )}
    </div>
  );
} 