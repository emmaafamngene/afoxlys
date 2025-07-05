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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to AFEX</h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect, share, and discover amazing content with AFEXClips
          </p>
          <div className="space-x-4">
            <Link
              to="/register"
              className="btn btn-primary"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="btn btn-secondary"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Feed</h1>
        <div className="flex space-x-4">
          <Link
            to="/create-post"
            className="btn btn-primary flex items-center space-x-2"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Post</span>
          </Link>
          <Link
            to="/create-clip"
            className="btn btn-secondary flex items-center space-x-2"
          >
            <FiVideo className="w-4 h-4" />
            <span>New Clip</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FiPlus className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-4">
                Follow some users or create your first post to see content here.
              </p>
              <Link to="/create-post" className="btn btn-primary">
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