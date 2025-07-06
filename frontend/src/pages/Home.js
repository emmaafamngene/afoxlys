import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postsAPI } from '../services/api';
import PostCard from '../components/posts/PostCard';
import { FiPlus, FiVideo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  usePageTitle('Home');

  useEffect(() => {
    fetchFeed();
  }, []);

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
    <div className="max-w-4xl mx-auto w-full animate-fade-in">
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

      {/* Content */}
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
    </div>
  );
};

export default Home; 