import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postsAPI } from '../services/api';
import { FiX, FiSend, FiEdit3, FiStar } from 'react-icons/fi';
import DefaultAvatar from '../components/DefaultAvatar';
import { getAvatarUrl } from '../utils/avatarUtils';

const CreatePost = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('content', content.trim());

      await postsAPI.create(formData);
      
      // Show success animation
      setShowSuccess(true);
      
      // Navigate back after animation
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error creating post:', error);
      console.log(error.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  // Success animation component
  const SuccessAnimation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl p-8 text-center animate-bounceIn">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiStar className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          ✨ Post Created!
        </h3>
        <p className="text-gray-600">
          Your post has been published!
        </p>
      </div>
    </div>
  );

  return (
    <>
      {showSuccess && <SuccessAnimation />}
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="animate-slideDown">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FiEdit3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Create Post
                  </h1>
                </div>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
              >
                <FiX className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
              </button>
            </div>
          </div>

          {/* User Info Card */}
          <div className="animate-slideUp delay-100">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6 transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {user?.avatar ? (
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt={user?.username}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-100 dark:ring-gray-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-12 h-12 rounded-xl ring-2 ring-blue-100 dark:ring-gray-700 ${user?.avatar ? 'hidden' : 'flex'}`}
                    style={{ display: user?.avatar ? 'none' : 'flex' }}
                  >
                    <DefaultAvatar 
                      username={`${user?.firstName} ${user?.lastName}`} 
                      size={48}
                      style={{ borderRadius: '12px' }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Form */}
          <div className="animate-slideUp delay-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Content Input */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
                <div className={`p-6 transition-all duration-300 ${isFocused ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700' : ''}`}>
                  <textarea
                    value={content}
                    onChange={handleContentChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="What's on your mind? Share your thoughts... 💭"
                    className="w-full p-0 border-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none text-lg leading-relaxed"
                    rows="6"
                    maxLength="1000"
                  />
                </div>
                
                {/* Character Counter */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {content.length}/1000 characters
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {content.length > 0 && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {Math.ceil(content.length / 50)} min read
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 animate-slideUp delay-300">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" />
                      <span>Create Post</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Tips Section */}
          <div className="animate-slideUp delay-400 mt-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <FiStar className="w-5 h-5 text-blue-500 mr-2" />
                Writing Tips
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Share your thoughts and experiences</li>
                <li>• Ask questions to start conversations</li>
                <li>• Be authentic and genuine</li>
                <li>• Engage with your community</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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
          animation: slideDown 0.6s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-bounceIn {
          animation: bounceIn 0.8s ease-out;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </>
  );
};

export default CreatePost; 