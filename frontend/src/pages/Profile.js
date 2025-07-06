import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, postsAPI, clipsAPI, followAPI } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import PostCard from '../components/posts/PostCard';
import ClipCard from '../components/clips/ClipCard';
import { DefaultAvatar } from '../components/layout/AFEXLogo';
import { FiEdit, FiSettings, FiGrid, FiVideo, FiUsers, FiUserPlus, FiUserCheck, FiMapPin, FiCalendar, FiLink, FiMail, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated, updateUser } = useAuth();
  const [user, setUser] = useState(null);
  
  usePageTitle(user ? `${user.username}'s Profile` : 'Profile');
  const [posts, setPosts] = useState([]);
  const [clips, setClips] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      checkFollowStatus();
    }
  }, [userId]);

  useEffect(() => {
    if (currentUser && userId) {
      setIsOwnProfile(currentUser._id === userId);
    }
  }, [currentUser, userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching profile for userId:', userId);
      
      const [userResponse, postsResponse, clipsResponse, followersResponse, followingResponse] = await Promise.all([
        usersAPI.getById(userId),
        usersAPI.getPosts(userId),
        usersAPI.getClips(userId),
        followAPI.getFollowers(userId),
        followAPI.getFollowing(userId)
      ]);

      console.log('🔍 User response:', userResponse);
      console.log('🔍 Posts response:', postsResponse);
      console.log('🔍 Clips response:', clipsResponse);
      console.log('🔍 Followers response:', followersResponse);
      console.log('🔍 Following response:', followingResponse);

      setUser(userResponse.data.user);
      setPosts(postsResponse.data.posts);
      setClips(clipsResponse.data.clips);
      setFollowers(followersResponse.data.followers);
      setFollowing(followingResponse.data.following);
      
      console.log('🔍 Profile data set successfully');
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        userId: userId
      });
      
      if (error.response?.status === 404) {
        toast.error('User not found');
      } else if (error.response?.status === 401) {
        toast.error('Please login to view profiles');
      } else {
        toast.error(`Failed to load profile: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!isAuthenticated || isOwnProfile) return;
    
    try {
      const response = await followAPI.checkFollow(userId);
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to follow users');
      return;
    }

    try {
      if (isFollowing) {
        await followAPI.toggleFollow(userId);
        setIsFollowing(false);
        setFollowers(prev => prev.filter(f => f._id !== currentUser._id));
        toast.success('Unfollowed successfully');
      } else {
        await followAPI.toggleFollow(userId);
        setIsFollowing(true);
        setFollowers(prev => [...prev, currentUser]);
        toast.success('Followed successfully');
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast.error('Failed to follow/unfollow');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF)');
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await usersAPI.uploadAvatar(userId, formData);
      
      // Update local user state
      setUser(prev => ({
        ...prev,
        avatar: response.data.avatar
      }));

      // Update current user context if it's the same user
      if (currentUser._id === userId) {
        await updateUser();
      }

      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUsers className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">User not found</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">The user you're looking for doesn't exist.</p>
          <Link to="/" className="btn btn-primary text-sm sm:text-base px-6 py-3">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-6 sm:mb-8">
        {/* Cover Photo Placeholder */}
        <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
          {isOwnProfile && (
            <button className="absolute top-3 right-3 p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg text-white hover:bg-opacity-30 transition-all">
              <FiCamera className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 sm:-mt-20 mb-4 sm:mb-6">
            {/* Avatar */}
            <div className="relative mb-4 sm:mb-0 sm:mr-6">
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <DefaultAvatar 
                  user={user} 
                  size="xl"
                  className={user.avatar ? 'hidden' : ''}
                />
                
                {isOwnProfile && (
                  <button
                    onClick={triggerAvatarUpload}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110"
                  >
                    {uploadingAvatar ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FiCamera className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-2">@{user.username}</p>
                  
                  {/* Bio */}
                  {user.bio && (
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                      {user.bio}
                    </p>
                  )}

                  {/* User Stats */}
                  <div className="flex flex-wrap gap-4 sm:gap-6 text-sm sm:text-base">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{followers.length}</span>
                      <span className="text-gray-500 dark:text-gray-400">followers</span>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <FiUserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{following.length}</span>
                      <span className="text-gray-500 dark:text-gray-400">following</span>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <FiGrid className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{posts.length}</span>
                      <span className="text-gray-500 dark:text-gray-400">posts</span>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <FiVideo className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{clips.length}</span>
                      <span className="text-gray-500 dark:text-gray-400">clips</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-0">
                  {isOwnProfile ? (
                    <>
                      <Link
                        to="/edit-profile"
                        className="btn btn-primary flex items-center justify-center space-x-2 text-sm sm:text-base px-4 py-2.5 sm:px-6 sm:py-3"
                      >
                        <FiEdit className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="btn btn-secondary flex items-center justify-center space-x-2 text-sm sm:text-base px-4 py-2.5 sm:px-6 sm:py-3"
                      >
                        <FiSettings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={handleFollow}
                      className={`btn flex items-center justify-center space-x-2 text-sm sm:text-base px-4 py-2.5 sm:px-6 sm:py-3 ${
                        isFollowing 
                          ? 'btn-secondary' 
                          : 'btn-primary'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <FiUserCheck className="w-4 h-4" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <FiUserPlus className="w-4 h-4" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => handleTabChange('posts')}
            className={`flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiGrid className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Posts ({posts.length})</span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange('clips')}
            className={`flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors ${
              activeTab === 'clips'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiVideo className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Clips ({clips.length})</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'posts' ? (
            <div className="space-y-4 sm:space-y-6">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <FiGrid className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">No posts yet</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {isOwnProfile ? "You haven't created any posts yet." : "This user hasn't created any posts yet."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {clips.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {clips.map((clip) => (
                    <ClipCard key={clip._id} clip={clip} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <FiVideo className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">No clips yet</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {isOwnProfile ? "You haven't created any clips yet." : "This user hasn't created any clips yet."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 