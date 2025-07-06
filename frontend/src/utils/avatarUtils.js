// Utility function to get proper avatar URL
export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  
  // If it's already a full URL, return as is
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // If it's a relative path, prepend the backend URL
  const backendUrl = process.env.REACT_APP_API_URL || 'https://afoxlys.onrender.com';
  return `${backendUrl}/uploads/avatars/${avatar}`;
};

// Utility function to get avatar with fallback
export const getAvatarWithFallback = (avatar, username, size = 40) => {
  if (!avatar) {
    return null; // Will trigger DefaultAvatar fallback
  }
  
  return getAvatarUrl(avatar);
}; 