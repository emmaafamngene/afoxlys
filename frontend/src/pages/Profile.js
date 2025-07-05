import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, postsAPI, clipsAPI, followAPI } from '../services/api';
import PostCard from '../components/posts/PostCard';
import ClipCard from '../components/clips/ClipCard';
import { FiEdit, FiSettings, FiGrid, FiVideo, FiUsers, FiUserPlus, FiUserCheck, FiMapPin, FiCalendar, FiLink, FiMail, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated, updateUser } = useAuth();
  const [user, setUser] = useState(null);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUsers className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user.avatar || 'https://via.placeholder.com/150x150/6b7280/ffffff?text=U'}
                alt={user.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150x150/6b7280/ffffff?text=U';
                }}
              />
              {isOwnProfile && (
                <button 
                  onClick={triggerAvatarUpload}
                  disabled={uploadingAvatar}
                  className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FiCamera className="w-4 h-4" />
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div className="mb-4 md:mb-0">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">@{user.username}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {isOwnProfile ? (
                    <>
                      <Link to="/edit-profile" className="btn btn-secondary flex items-center space-x-2">
                        <FiEdit className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </Link>
                      <Link to="/settings" className="btn btn-secondary">
                        <FiSettings className="w-5 h-5" />
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={handleFollow}
                      className={`btn flex items-center space-x-2 ${
                        isFollowing ? 'btn-secondary' : 'btn-primary'
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

              {/* Bio */}
              {user.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4 text-lg leading-relaxed">
                  {user.bio}
                </p>
              )}

              {/* User Details */}
              <div className="flex flex-wrap items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
                {user.location && (
                  <div className="flex items-center space-x-1">
                    <FiMapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center space-x-1">
                    <FiLink className="w-4 h-4" />
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                      {user.website}
                    </a>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <FiCalendar className="w-4 h-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{posts.length}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{clips.length}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">AFEXClips</div>
                </div>
                <Link to={`/user/${userId}/followers`} className="text-center hover:text-blue-600 transition-colors">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{followers.length}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Followers</div>
                </Link>
                <Link to={`/user/${userId}/following`} className="text-center hover:text-blue-600 transition-colors">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{following.length}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Following</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm mb-8">
          <button
            onClick={() => handleTabChange('posts')}
            className={`flex items-center space-x-2 flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'posts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FiGrid className="w-4 h-4" />
            <span>Posts ({posts.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('clips')}
            className={`flex items-center space-x-2 flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'clips'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FiVideo className="w-4 h-4" />
            <span>AFEXClips ({clips.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <div>
            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <FiGrid className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {isOwnProfile 
                    ? "Share your first post with the world and start building your audience!"
                    : `${user.firstName} hasn't shared any posts yet.`
                  }
                </p>
                {isOwnProfile && (
                  <Link to="/create-post" className="btn btn-primary">
                    Create Your First Post
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'clips' && (
          <div>
            {clips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clips.map((clip) => (
                  <ClipCard key={clip._id} clip={clip} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <FiVideo className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No AFEXClips yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {isOwnProfile 
                    ? "Create your first AFEXClip and start trending! Share your moments with the world."
                    : `${user.firstName} hasn't created any AFEXClips yet.`
                  }
                </p>
                {isOwnProfile && (
                  <Link to="/create-clip" className="btn btn-primary">
                    Create Your First Clip
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 