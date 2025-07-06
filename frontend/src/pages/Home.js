import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postsAPI, confessionsAPI, swipeAPI } from '../services/api';
import PostCard from '../components/posts/PostCard';
import SwipeCard from '../components/swipe/SwipeCard';
import ConfessionCard from '../components/confessions/ConfessionCard';
import NewConfessionModal from '../components/confessions/NewConfessionModal';
import { FiPlus, FiVideo, FiMessageCircle, FiTrendingUp } from 'react-icons/fi';
import { usePageTitle } from '../hooks/usePageTitle';
import AnimatedPage from '../components/AnimatedPage';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [confessions, setConfessions] = useState([]);
  const [confessionsLoading, setConfessionsLoading] = useState(true);
  const [confessionsPage, setConfessionsPage] = useState(1);
  const [confessionsHasMore, setConfessionsHasMore] = useState(true);
  const [currentSwipePost, setCurrentSwipePost] = useState(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isConfessionModalOpen, setIsConfessionModalOpen] = useState(false);
  const [swipeLoading, setSwipeLoading] = useState(false);
  const [swipeError, setSwipeError] = useState(null);
  const [noMoreSwipePosts, setNoMoreSwipePosts] = useState(false);
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed();
      if (activeTab === 'confessions') {
        fetchConfessions(1);
      } else if (activeTab === 'swipe') {
        fetchRandomSwipePost();
      }
    }
  }, [isAuthenticated, activeTab]);

  // Listen for tutorial tab switching events
  useEffect(() => {
    const handleSwitchToSwipe = () => {
      setActiveTab('swipe');
    };

    const handleSwitchToConfessions = () => {
      setActiveTab('confessions');
    };

    window.addEventListener('switchToSwipe', handleSwitchToSwipe);
    window.addEventListener('switchToConfessions', handleSwitchToConfessions);

    return () => {
      window.removeEventListener('switchToSwipe', handleSwitchToSwipe);
      window.removeEventListener('switchToConfessions', handleSwitchToConfessions);
    };
  }, []);

  const fetchFeed = async (retryCount = 0) => {
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
  };

  const fetchConfessions = async (pageNum = 1, retryCount = 0) => {
    try {
      setConfessionsLoading(true);
      const response = await confessionsAPI.getAll(pageNum);
      if (pageNum === 1) {
        setConfessions(response.data.confessions || []);
      } else {
        setConfessions(prev => [...prev, ...(response.data.confessions || [])]);
      }
      setConfessionsPage(pageNum);
      setConfessionsHasMore(response.data.confessions?.length === 20);
    } catch (error) {
      console.error('Error fetching confessions:', error);
      if (retryCount < 2) {
        // Retry after 2 seconds
        setTimeout(() => fetchConfessions(pageNum, retryCount + 1), 2000);
        return;
      }
      // Show fallback data
      if (pageNum === 1) {
        setConfessions([]);
      }
      console.log('Failed to load confessions. Please try again.');
    } finally {
      setConfessionsLoading(false);
    }
  };

  const loadMoreConfessions = () => {
    if (confessionsHasMore) {
      fetchConfessions(confessionsPage + 1);
    }
  };

  const fetchRandomSwipePost = async (retryCount = 0) => {
    try {
      setSwipeLoading(true);
      setSwipeError(null);
      const response = await swipeAPI.getRandomPost();
      setCurrentSwipePost(response.data.post || response.data);
      setNoMoreSwipePosts(false);
    } catch (error) {
      console.error('Error fetching swipe post:', error);
      if (retryCount < 2) {
        // Retry after 2 seconds
        setTimeout(() => fetchRandomSwipePost(retryCount + 1), 2000);
        return;
      }
      setCurrentSwipePost(null);
      setNoMoreSwipePosts(true);
      setSwipeError('Failed to load swipe post. Please try again.');
      console.log('Failed to load swipe post. Please try again.');
    } finally {
      setSwipeLoading(false);
    }
  };

  const handleSwipeVote = async (voteType, post) => {
    try {
      await swipeAPI.vote(post._id, voteType);
      
      // Get next post
      fetchRandomSwipePost();
    } catch (error) {
      console.error('Error voting:', error);
      console.log('Failed to vote. Please try again.');
    }
  };

  const handleConfessionPosted = (newConfession) => {
    setConfessions(prev => [newConfession, ...prev]);
  };

  const handleConfessionUpdate = (updatedConfession) => {
    setConfessions(prev => 
      prev.map(conf => 
        conf._id === updatedConfession._id ? updatedConfession : conf
      )
    );
  };

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

  const ConfessionsLoadingState = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow animate-pulse">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mt-1"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const SwipeLoadingState = () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading swipe post...</p>
      </div>
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

  const EmptyConfessionsState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
        <FiMessageCircle className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No confessions yet</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">Be the first to share a confession!</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => fetchConfessions(1)}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Create Post
        </button>
      </div>
    </div>
  );

  const EmptySwipeState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
        <FiTrendingUp className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No posts to swipe</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">All posts have been voted on! Check back later.</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => fetchRandomSwipePost()}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          View Feed
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

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
        <button
          data-intro-swipe
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'posts'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          📝 Posts
        </button>
        <button
          onClick={() => setActiveTab('swipe')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'swipe'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          🔥 Swipe Game
        </button>
        <button
          data-intro-confess
          onClick={() => setActiveTab('confessions')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'confessions'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          💖 Confessions
        </button>
      </div>

      {/* Content */}
      {activeTab === 'posts' && (
        <>
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
        </>
      )}

      {activeTab === 'swipe' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              🔥 Hot or Not
            </h2>
            <Link
              to="/create-post?for=swipe"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>📤</span>
              Submit to Swipe
            </Link>
          </div>

          {swipeLoading ? (
            <SwipeLoadingState />
          ) : swipeError ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😢</div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                {swipeError}
              </h3>
              <button
                onClick={fetchRandomSwipePost}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : noMoreSwipePosts ? (
            <EmptySwipeState />
          ) : currentSwipePost ? (
            <SwipeCard
              post={currentSwipePost}
              onVote={handleSwipeVote}
              onNext={fetchRandomSwipePost}
            />
          ) : null}
        </div>
      )}

      {activeTab === 'confessions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              💖 Confession Box
            </h2>
            <button
              onClick={() => setIsConfessionModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>✍️</span>
              Write Confession
            </button>
          </div>

          <div className="space-y-4">
            {confessionsLoading ? (
              <ConfessionsLoadingState />
            ) : confessions.length > 0 ? (
              <>
                {confessions.map((confession) => (
                  <ConfessionCard
                    key={confession._id}
                    confession={confession}
                    onUpdate={handleConfessionUpdate}
                  />
                ))}
                {confessionsHasMore && (
                  <div className="text-center py-4">
                    <button
                      onClick={loadMoreConfessions}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyConfessionsState />
            )}
          </div>
        </div>
      )}

      {/* New Confession Modal */}
      <NewConfessionModal
        isOpen={isConfessionModalOpen}
        onClose={() => setIsConfessionModalOpen(false)}
        onConfessionPosted={handleConfessionPosted}
      />
      </div>
    </AnimatedPage>
  );
};

export default Home; 