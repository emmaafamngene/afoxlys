import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postsAPI } from '../services/api';
import { FiImage, FiVideo, FiX, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CreatePost = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Check if this post is for the swipe game
  const isForSwipeGame = searchParams.get('for') === 'swipe';

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
    
    if (validImageTypes.includes(file.type)) {
      setMediaType('image');
    } else if (validVideoTypes.includes(file.type)) {
      setMediaType('video');
    } else {
      toast.error('Please select a valid image or video file');
      return;
    }

    setMedia(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaType(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && !media) {
      toast.error('Please add some content or media to your post');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      
      if (media) {
        formData.append('postMedia', media);
        formData.append('mediaType', mediaType);
      }

      await postsAPI.create(formData);
      
      const successMessage = isForSwipeGame 
        ? 'Post submitted to Swipe Game successfully! 🔥' 
        : 'Post created successfully!';
      
      toast.success(successMessage);
      
      // Navigate back to appropriate page
      if (isForSwipeGame) {
        navigate('/swipe');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const event = { target: { files: [file] } };
      handleFileSelect(event);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isForSwipeGame ? '🔥 Submit to Swipe Game' : 'Create Post'}
            </h1>
            {isForSwipeGame && (
              <p className="text-sm text-gray-600 mt-1">
                Your post will be available for others to vote on in the Swipe Game!
              </p>
            )}
          </div>
          <button
            onClick={() => navigate(isForSwipeGame ? '/swipe' : '/')}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-6">
            <img
              src={user?.avatar || 'https://via.placeholder.com/40x40/6b7280/ffffff?text=U'}
              alt={user?.username}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/40x40/6b7280/ffffff?text=U';
              }}
            />
            <div>
              <p className="font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-500">@{user?.username}</p>
            </div>
          </div>

          {/* Content Input */}
          <div className="mb-6">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder={isForSwipeGame ? "What's your post for the Swipe Game?" : "What's on your mind?"}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows="4"
              maxLength="1000"
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm text-gray-500">
                {content.length}/1000 characters
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="mb-6">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                mediaPreview
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {!mediaPreview ? (
                <div>
                  <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">
                    {isForSwipeGame 
                      ? 'Upload an image or video for the Swipe Game! ' 
                      : 'Drag and drop an image or video here, or '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports: JPG, PNG, GIF, MP4, AVI, MOV, WMV (max 10MB)
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {mediaType === 'image' ? (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      controls
                      className="max-h-64 mx-auto rounded-lg"
                    />
                  )}
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(isForSwipeGame ? '/swipe' : '/')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!content.trim() && !media)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : (isForSwipeGame ? 'Submit to Swipe Game 🔥' : 'Create Post')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost; 