// Utility function to get proper avatar URL
export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  
  // If it's already a full URL (Cloudinary or other), return as is
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // If it's a relative path, prepend the backend URL (for legacy uploads)
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

// Utility function to check if avatar is from Cloudinary
export const isCloudinaryAvatar = (avatar) => {
  if (!avatar) return false;
  return avatar.includes('cloudinary.com') || avatar.includes('res.cloudinary.com');
};

// Utility function to get optimized Cloudinary URL with transformations
export const getOptimizedAvatarUrl = (avatar, size = 150) => {
  if (!avatar) return null;
  
  // If it's a Cloudinary URL, add optimization parameters
  if (isCloudinaryAvatar(avatar)) {
    // Add Cloudinary transformations for optimization
    return avatar.replace('/upload/', `/upload/c_fill,g_face,h_${size},w_${size},q_auto/`);
  }
  
  // For non-Cloudinary URLs, return as is
  return getAvatarUrl(avatar);
}; 