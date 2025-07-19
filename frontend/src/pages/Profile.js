import React, { useState } from 'react';
import { FiUser, FiEdit, FiCamera, FiUsers, FiGrid, FiSun, FiMoon } from 'react-icons/fi';
import DefaultAvatar from '../components/DefaultAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { followAPI, chatAPI, usersAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://afoxlys.onrender.com/api';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [avatarError, setAvatarError] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  // Add forceUpdate for forced re-render
  const [, forceUpdate] = useState(0);

  // Fetch profile user and follow status
  React.useEffect(() => {
    async function fetchProfile() {
      const res = await usersAPI.getById(userId);
      setProfileUser(res.data.user);
      if (currentUser && userId !== currentUser._id) {
        const followRes = await followAPI.checkFollow(userId);
        setIsFollowing(followRes.data.isFollowing);
      }
    }
    if (userId) fetchProfile();
  }, [userId, currentUser]);

  let avatarUrl = '';
  if (profileUser?.avatar) {
    avatarUrl = profileUser.avatar.startsWith('http')
      ? profileUser.avatar
      : `${API_BASE_URL.replace(/\/api$/, '')}/uploads/avatars/${profileUser.avatar}`;
  }

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  // Remove all previous follow logic and rewrite:
  React.useEffect(() => {
    if (profileUser && currentUser && profileUser._id !== currentUser._id) {
      // Set initial followers count and follow state
      setFollowersCount(profileUser.followers?.length || 0);
      setIsFollowing(profileUser.followers?.some(f => (typeof f === 'string' ? f : f._id) === currentUser._id));
    }
  }, [profileUser, currentUser]);

  const handleFollow = async () => {
    const endpoint = isFollowing ? '/unfollow/' : '/follow/';
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}${profileUser._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ myId: currentUser._id })
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setFollowersCount(count => isFollowing ? Math.max(0, count - 1) : count + 1);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleChat = async () => {
    setLoadingChat(true);
    try {
      const res = await chatAPI.createConversation(currentUser._id, userId);
      const conversationId = res.data._id;
      navigate(`/chat?conversationId=${conversationId}`);
    } finally {
      setLoadingChat(false);
    }
  };

  const isOwnProfile = currentUser && profileUser && currentUser._id === profileUser._id;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 transition-colors duration-300">
      <div className="w-full max-w-2xl mx-auto p-6 sm:p-10 rounded-3xl shadow-2xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 flex flex-col items-center relative">
        {/* Avatar and Edit */}
        <div className="relative flex flex-col items-center w-full">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-blue-400 dark:border-blue-700 shadow-lg bg-gray-200 dark:bg-gray-800">
            {!avatarError && profileUser?.avatar ? (
              <img
                src={avatarUrl}
                alt={profileUser.username}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <DefaultAvatar username={profileUser?.username || 'User'} size={160} />
            )}
          </div>
          <div className="mt-4 flex flex-col items-center w-full">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{profileUser?.username || 'username'}</span>
            <span className="text-lg text-gray-500 dark:text-gray-300 mt-1">{profileUser?.firstName || ''} {profileUser?.lastName || ''}</span>
            <div className="flex flex-row gap-6 mt-4 w-full justify-center">
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg text-gray-900 dark:text-white">{profileUser?.posts?.length || 0}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Posts</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg text-gray-900 dark:text-white">{followersCount}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg text-gray-900 dark:text-white">{profileUser?.following?.length || 0}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Following</span>
              </div>
            </div>
            <div className="mt-4 text-center w-full">
              <span className="text-base text-gray-700 dark:text-gray-300 italic">{profileUser?.bio || 'No bio yet. Add something about yourself!'}</span>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-row gap-4 mt-8 w-full justify-center">
          {isOwnProfile && (
            <button
              onClick={() => window.open('/studio', '_blank')}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 dark:bg-purple-500 text-white font-semibold shadow hover:bg-purple-700 dark:hover:bg-purple-400 transition-colors"
            >
              Create Flick
            </button>
          )}
          {isOwnProfile ? (
            <>
              <button onClick={handleEditProfile} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-semibold shadow hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors">
                <FiEdit className="w-4 h-4" />
                Edit Profile
              </button>
              <button className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <FiGrid className="w-4 h-4" />
                Posts
              </button>
            </>
          ) : profileUser && currentUser && profileUser._id !== currentUser._id ? (
            <>
              <button
                onClick={handleFollow}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl ${isFollowing ? 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'bg-blue-600 dark:bg-blue-500 text-white'} font-semibold shadow hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors`}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
              <button
                onClick={handleChat}
                disabled={loadingChat}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-green-600 dark:bg-green-500 text-white font-semibold shadow hover:bg-green-700 dark:hover:bg-green-400 transition-colors"
              >
                Chat
              </button>
            </>
          ) : null}
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