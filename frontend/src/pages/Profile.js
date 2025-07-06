import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, followAPI } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import PostCard from '../components/posts/PostCard';
import ClipCard from '../components/clips/ClipCard';
import Badge from '../components/Badge';
import DefaultAvatar from '../components/DefaultAvatar';
import { getAvatarUrl } from '../utils/avatarUtils';
import { 
  FiEdit, FiSettings, FiGrid, FiVideo, FiUsers, FiUserPlus, FiUserCheck, 
  FiMapPin, FiCalendar, FiLink, FiCamera, FiShare2,
  FiMoreHorizontal, FiFlag, FiShield, FiHome, FiX, FiAward
} from 'react-icons/fi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://afoxlys.onrender.com/api';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated, updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [clips, setClips] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [badges, setBadges] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const fileInputRef = useRef(null);
  
  usePageTitle(user ? `${user.username}'s Profile` : 'Profile');
  


  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Make API calls individually to see which one fails
      try {
        const userResponse = await usersAPI.getById(userId);
        setUser(userResponse.data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      }
      
      try {
        const postsResponse = await usersAPI.getPosts(userId);
        setPosts(postsResponse.data.posts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      }
      
      try {
        const clipsResponse = await usersAPI.getClips(userId);
        setClips(clipsResponse.data.clips);
      } catch (error) {
        console.error('Error fetching clips:', error);
        setClips([]);
      }
      
      try {
        const followersResponse = await followAPI.getFollowers(userId);
        setFollowers(followersResponse.data.followers);
      } catch (error) {
        console.error('Error fetching followers:', error);
        setFollowers([]);
      }
      
      try {
        const followingResponse = await followAPI.getFollowing(userId);
        setFollowing(followingResponse.data.following);
      } catch (error) {
        console.error('Error fetching following:', error);
        setFollowing([]);
      }
      
      try {
        const badgesResponse = await fetch(`${API_BASE_URL}/users/${userId}/badges`).then(res => res.json());
        setBadges(badgesResponse.badges || []);
      } catch (error) {
        console.error('Error fetching badges:', error);
        setBadges([]);
      }
      
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const checkFollowStatus = useCallback(async () => {
    if (!isAuthenticated || isOwnProfile) return;
    
    try {
      const response = await followAPI.checkFollow(userId);
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  }, [userId, isAuthenticated, isOwnProfile]);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      checkFollowStatus();
    }
  }, [userId, fetchUserProfile, checkFollowStatus]);

  useEffect(() => {
    if (currentUser && userId) {
      setIsOwnProfile(currentUser._id === userId);
    }
  }, [currentUser, userId]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      console.log('Please login to follow users');
      return;
    }

    try {
      if (isFollowing) {
        await followAPI.toggleFollow(userId);
        setIsFollowing(false);
        setFollowers(prev => prev.filter(f => f._id !== currentUser._id));
        console.log('Unfollowed successfully');
      } else {
        await followAPI.toggleFollow(userId);
        setIsFollowing(true);
        setFollowers(prev => [...prev, currentUser]);
        console.log('Followed successfully');
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      console.log('Failed to follow/unfollow');
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
      console.log('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      console.log('Please select a valid image file (JPG, PNG, GIF)');
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

      console.log('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      console.log('Failed to update profile picture');
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

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleReport = () => {
    console.log('Report user functionality');
    setShowMenu(false);
  };

  const handleBlock = () => {
    console.log('Block user functionality');
    setShowMenu(false);
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    console.log('Profile link copied to clipboard');
    setShowShareModal(false);
  };

  const shareToSocial = (platform) => {
    const url = window.location.href;
    const text = `Check out ${user.firstName} ${user.lastName}'s profile on AFEX!`;
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };

    window.open(shareUrls[platform], '_blank');
    setShowShareModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex justify-center items-center min-h-screen">
          <div className="flex flex-col items-center space-y-4 animate-fadeIn">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{ animationDelay: '0.5s' }}></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex justify-center items-center min-h-screen px-4">
          <div className="text-center max-w-md animate-fadeIn">
            <div className="w-24 h-24 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiUsers className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">User not found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The user you're looking for doesn't exist or has been removed.</p>
            <Link 
              to="/" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              <FiHome className="w-5 h-5 mr-2" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 animate-bounceIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Share Profile</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={copyProfileLink}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiLink className="w-4 h-4" />
                <span>Copy Link</span>
              </button>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="p-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Twitter
                </button>
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Facebook
                </button>
                <button
                  onClick={() => shareToSocial('linkedin')}
                  className="p-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  LinkedIn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto w-full px-4 py-8">
          {/* Profile Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8 animate-slideDown">
            {/* Cover Photo */}
            <div className="h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              
              {/* Cover Photo Actions */}
              {isOwnProfile && (
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all">
                    <FiCamera className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Profile Actions */}
              <div className="absolute bottom-4 right-4 flex space-x-2">
                {!isOwnProfile && (
                  <>
                    <button
                      onClick={handleShare}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all"
                    >
                      <FiShare2 className="w-5 h-5" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all"
                      >
                        <FiMoreHorizontal className="w-5 h-5" />
                      </button>
                      
                      {showMenu && (
                        <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 w-48 animate-fadeIn">
                          <button
                            onClick={handleReport}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <FiFlag className="w-4 h-4" />
                            <span>Report User</span>
                          </button>
                          <button
                            onClick={handleBlock}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <FiShield className="w-4 h-4" />
                            <span>Block User</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="px-6 pb-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-end -mt-20 mb-6">
                {/* Avatar */}
                <div className="relative mb-4 lg:mb-0 lg:mr-6">
                  <div className="relative">
                    {user.avatar ? (
                      <img
                        src={getAvatarUrl(user.avatar)}
                        alt={user.username}
                        className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl border-4 border-white dark:border-gray-800 shadow-xl object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-32 h-32 lg:w-40 lg:h-40 rounded-2xl border-4 border-white dark:border-gray-800 shadow-xl ${user.avatar ? 'hidden' : 'flex'}`}>
                      <DefaultAvatar 
                        username={`${user.firstName} ${user.lastName}`} 
                        size={user.avatar ? 0 : 128}
                        style={{ borderRadius: '16px', width: '100%', height: '100%' }}
                      />
                    </div>
                    
                    {isOwnProfile && (
                      <button
                        onClick={triggerAvatarUpload}
                        disabled={uploadingAvatar}
                        className="absolute bottom-2 right-2 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-110"
                      >
                        {uploadingAvatar ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <FiCamera className="w-5 h-5" />
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
                  
                  {/* Online Status */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 animate-pulse"></div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {user.firstName} {user.lastName}
                      </h1>
                      <p className="text-lg text-gray-500 dark:text-gray-400 mb-3">@{user.username}</p>
                      
                      {/* Bio */}
                      {user.bio && (
                        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed max-w-2xl">
                          {user.bio}
                        </p>
                      )}

                      {/* User Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {user.location && (
                          <div className="flex items-center space-x-1">
                            <FiMapPin className="w-4 h-4" />
                            <span>{user.location}</span>
                          </div>
                        )}
                        {user.website && (
                          <div className="flex items-center space-x-1">
                            <FiLink className="w-4 h-4" />
                            <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400">
                              Website
                            </a>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <FiCalendar className="w-4 h-4" />
                          <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* User Stats */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 text-center transform hover:scale-105 transition-all">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{followers.length}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 text-center transform hover:scale-105 transition-all">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{following.length}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 text-center transform hover:scale-105 transition-all">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{posts.length}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
                        </div>
                        <div className="bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl p-4 text-center transform hover:scale-105 transition-all">
                          <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{clips.length}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Clips</div>
                        </div>
                      </div>

                      {/* Badges */}
                      {badges.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <FiAward className="w-5 h-5 text-yellow-500 mr-2" />
                            Achievements ({badges.length})
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {badges.map((badge) => (
                              <Badge key={badge._id} badge={badge} size="md" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
                      {isOwnProfile ? (
                        <>
                          <Link
                            to="/edit-profile"
                            className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                          >
                            <FiEdit className="w-4 h-4" />
                            <span>Edit Profile</span>
                          </Link>
                          <Link
                            to="/settings"
                            className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all transform hover:scale-105"
                          >
                            <FiSettings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                        </>
                      ) : (
                        <button
                          onClick={handleFollow}
                          className={`inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg ${
                            isFollowing 
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600' 
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slideUp">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleTabChange('posts')}
                className={`flex-1 lg:flex-none px-6 py-4 text-sm lg:text-base font-medium transition-all duration-300 ${
                  activeTab === 'posts'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FiGrid className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span>Posts ({posts.length})</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('clips')}
                className={`flex-1 lg:flex-none px-6 py-4 text-sm lg:text-base font-medium transition-all duration-300 ${
                  activeTab === 'clips'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FiVideo className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span>Clips ({clips.length})</span>
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'posts' ? (
                <div className="space-y-6">
                  {posts.length > 0 ? (
                    posts.map((post, index) => (
                      <div key={post._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                        <PostCard post={post} />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 animate-fadeIn">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiGrid className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isOwnProfile ? "Start sharing your thoughts and experiences!" : "This user hasn't created any posts yet."}
                      </p>
                      {isOwnProfile && (
                        <Link
                          to="/create-post"
                          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                        >
                          <FiEdit className="w-4 h-4" />
                          <span>Create Your First Post</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {clips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {clips.map((clip, index) => (
                        <div key={clip._id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                          <ClipCard clip={clip} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 animate-fadeIn">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiVideo className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No clips yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isOwnProfile ? "Start creating amazing video clips!" : "This user hasn't created any clips yet."}
                      </p>
                      {isOwnProfile && (
                        <Link
                          to="/create-clip"
                          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
                        >
                          <FiVideo className="w-4 h-4" />
                          <span>Create Your First Clip</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.8s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.8s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-bounceIn {
          animation: bounceIn 0.8s ease-out;
        }
      `}</style>
    </>
  );
};

export default Profile; 