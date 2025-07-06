import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postsAPI } from '../services/api';
import PostCard from '../components/posts/PostCard';
import SwipeCard from '../components/swipe/SwipeCard';
import ConfessionCard from '../components/confessions/ConfessionCard';
import NewConfessionModal from '../components/confessions/NewConfessionModal';
import { FiPlus, FiVideo, FiHeart, FaFire } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [confessions, setConfessions] = useState([]);
  const [confessionsLoading, setConfessionsLoading] = useState(true);
  const [confessionsPage, setConfessionsPage] = useState(1);
  const [confessionsHasMore, setConfessionsHasMore] = useState(true);
  const [currentSwipePost, setCurrentSwipePost] = useState(null);
  const [swipeError, setSwipeError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isConfessionModalOpen, setIsConfessionModalOpen] = useState(false);
  const [swipeLoading, setSwipeLoading] = useState(false);
  const [noMoreSwipePosts, setNoMoreSwipePosts] = useState(false);
  
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

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getAll({ page: 1, limit: 10 });
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching feed:', error);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfessions = async (page = 1) => {
    try {
      setConfessionsLoading(true);
      const response = await api.get('/confessions', {
        params: { page, limit: 10 }
      });
      if (page === 1) {
        setConfessions(response.data.confessions);
      } else {
        setConfessions(prev => [...prev, ...response.data.confessions]);
      }
      setConfessionsHasMore(response.data.currentPage < response.data.totalPages);
      setConfessionsPage(page);
    } catch (error) {
      console.error('Error fetching confessions:', error);
      toast.error('Failed to load confessions');
    } finally {
      setConfessionsLoading(false);
    }
  };

  const loadMoreConfessions = () => {
    if (confessionsHasMore) {
      fetchConfessions(confessionsPage + 1);
    }
  };

  const fetchRandomSwipePost = async () => {
    try {
      setSwipeLoading(true);
      setSwipeError(null);
      const response = await api.get('/swipe/post');
      setCurrentSwipePost(response.data);
      setNoMoreSwipePosts(false);
    } catch (error) {
      if (error.response?.status === 404) {
        setNoMoreSwipePosts(true);
        setCurrentSwipePost(null);
      } else {
        setSwipeError('Failed to load swipe post.');
        setCurrentSwipePost(null);
        console.error('Error fetching random post:', error);
      }
    } finally {
      setSwipeLoading(false);
    }
  };

  const handleSwipeVote = async (voteType, post) => {
    try {
      await api.post('/swipe/vote', {
        postId: post._id,
        voteType
      });
      
      // Get next post
      fetchRandomSwipePost();
    } catch (error) {
      console.error('Error voting:', error);
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

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Your Feed</h1>
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
            <div className="flex justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <FiPlus className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">No posts yet</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-4">
                    Follow some users or create your first post to see content here.
                  </p>
                  <Link 
                    to="/create-post" 
                    className="btn btn-primary text-sm sm:text-base px-6 py-3"
                  >
                    Create Your First Post
                  </Link>
                </div>
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
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading next post...</p>
            </div>
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
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                You've seen all posts!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Submit your own post to keep the game going!
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={fetchRandomSwipePost}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Refresh
                </button>
                <Link
                  to="/create-post?for=swipe"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Your Post
                </Link>
              </div>
            </div>
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
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading confessions...</p>
              </div>
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
              <div className="text-center py-8">
                <div className="text-6xl mb-4">😶</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No confessions yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Be the first to share a confession!
                </p>
                <button
                  onClick={() => setIsConfessionModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Write First Confession
                </button>
              </div>
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