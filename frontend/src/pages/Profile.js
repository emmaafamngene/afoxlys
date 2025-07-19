import React, { useState } from 'react';
import { FiUser, FiEdit, FiCamera, FiUsers, FiGrid, FiSun, FiMoon } from 'react-icons/fi';
import DefaultAvatar from '../components/DefaultAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://afoxlys.onrender.com/api';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [avatarError, setAvatarError] = useState(false);

  let avatarUrl = '';
  if (user?.avatar) {
    avatarUrl = user.avatar.startsWith('http')
      ? user.avatar
      : `${API_BASE_URL.replace(/\/api$/, '')}/uploads/avatars/${user.avatar}`;
  }

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 transition-colors duration-300">
      <div className="w-full max-w-2xl mx-auto p-6 sm:p-10 rounded-3xl shadow-2xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 flex flex-col items-center relative">
        {/* Avatar and Edit */}
        <div className="relative flex flex-col items-center w-full">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-blue-400 dark:border-blue-700 shadow-lg bg-gray-200 dark:bg-gray-800">
            {!avatarError && user?.avatar ? (
              <img
                src={avatarUrl}
                alt={user.username}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <DefaultAvatar username={user?.username || 'User'} size={160} />
            )}
          </div>
          <div className="mt-4 flex flex-col items-center w-full">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{user?.username || 'username'}</span>
            <span className="text-lg text-gray-500 dark:text-gray-300 mt-1">{user?.firstName || ''} {user?.lastName || ''}</span>
            <div className="flex flex-row gap-6 mt-4 w-full justify-center">
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg text-gray-900 dark:text-white">{user?.posts?.length || 0}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Posts</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg text-gray-900 dark:text-white">{user?.followers?.length || 0}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg text-gray-900 dark:text-white">{user?.following?.length || 0}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Following</span>
              </div>
            </div>
            <div className="mt-4 text-center w-full">
              <span className="text-base text-gray-700 dark:text-gray-300 italic">{user?.bio || 'No bio yet. Add something about yourself!'}</span>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-row gap-4 mt-8 w-full justify-center">
          <button onClick={handleEditProfile} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-semibold shadow hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors">
            <FiEdit className="w-4 h-4" />
            Edit Profile
          </button>
          <button className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <FiGrid className="w-4 h-4" />
            Posts
          </button>
        </div>
        {/* Responsive Theme Toggle Preview (for demonstration) */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-gray-400 dark:text-gray-500">Theme:</span>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800">
            <FiSun className="w-5 h-5 text-yellow-400 dark:text-gray-400" />
          </span>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800">
            <FiMoon className="w-5 h-5 text-gray-600 dark:text-blue-400" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default Profile; 