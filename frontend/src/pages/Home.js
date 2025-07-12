import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postsAPI } from '../services/api';
import PostCard from '../components/posts/PostCard';
import { FiPlus, FiVideo, FiMessageCircle } from 'react-icons/fi';
import { usePageTitle } from '../hooks/usePageTitle';
import AnimatedPage from '../components/AnimatedPage';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  usePageTitle('Home');

  const fetchFeed = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await postsAPI.getFeed();
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching feed:', error);
      if (retryCount < 2) {
        // Retry after 2 seconds
        setTimeout(() => fetchFeed(retryCount + 1), 2000);
        return;
      }
      // Show fallback data or empty state
      setPosts([]);
      console.log('Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);



  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed();
    }
  }, [isAuthenticated, fetchFeed]);





  // Tab-specific loading components
  const FeedLoadingState = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow animate-pulse">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-1"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );



  // Empty state components
  const EmptyFeedState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
        <FiMessageCircle className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No posts yet</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">Follow some users to see their posts in your feed!</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => fetchFeed()}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={() => navigate('/search')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Discover Users
        </button>
      </div>
    </div>
  );



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center max-w-md w-full">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
            <span className="text-white font-bold text-xl sm:text-2xl">A</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Welcome to AFEX</h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
            Connect, share, and discover amazing content with AFEXClips
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              to="/register"
              className="btn btn-primary text-sm sm:text-base px-6 py-3"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="btn btn-secondary text-sm sm:text-base px-6 py-3"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <FeedLoadingState />
        </div>
      </div>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Your Feed</h1>
          {!isOnline && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Offline</span>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <Link
            to="/create-post"
            className="btn btn-primary flex items-center justify-center space-x-2 text-sm sm:text-base px-4 py-2.5 sm:px-6 sm:py-3"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Post</span>
          </Link>
          <Link
            to="/create-clip"
            className="btn btn-secondary flex items-center justify-center space-x-2 text-sm sm:text-base px-4 py-2.5 sm:px-6 sm:py-3"
          >
            <FiVideo className="w-4 h-4" />
            <span>New Clip</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <FeedLoadingState />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))
          ) : (
            <EmptyFeedState />
          )}
        </div>
      )}
      </div>
    </AnimatedPage>
  );
};

export default Home; 