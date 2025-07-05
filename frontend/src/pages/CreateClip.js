import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clipsAPI } from '../services/api';
import { FiVideo, FiX, FiUpload, FiHash } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CreateClip = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await clipsAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

  const handleTagsChange = (e) => {
    setTags(e.target.value);
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (50MB limit for clips)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('Video size must be less than 50MB');
      return;
    }

    // Validate file type
    const validVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
    
    if (!validVideoTypes.includes(file.type)) {
      toast.error('Please select a valid video file (MP4, AVI, MOV, WMV)');
      return;
    }

    setVideo(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setVideoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeVideo = () => {
    setVideo(null);
    setVideoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please add a title to your clip');
      return;
    }

    if (!video) {
      toast.error('Please select a video for your clip');
      return;
    }

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('tags', tags.trim());
      formData.append('clipVideo', video);

      await clipsAPI.create(formData);
      
      toast.success('AFEXClip created successfully!');
      navigate('/clips');
    } catch (error) {
      console.error('Error creating clip:', error);
      toast.error(error.response?.data?.message || 'Failed to create clip');
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
      handleVideoSelect(event);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create AFEXClip</h1>
          <button
            onClick={() => navigate('/clips')}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-3">
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

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Video *
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                videoPreview
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {!videoPreview ? (
                <div>
                  <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop a vertical video here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports: MP4, AVI, MOV, WMV (max 50MB, vertical format recommended)
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <video
                    src={videoPreview}
                    controls
                    className="max-h-96 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeVideo}
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
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="Give your clip an engaging title"
              className="input"
              maxLength="100"
            />
            <div className="text-sm text-gray-500 mt-1">
              {title.length}/100 characters
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Tell viewers what your clip is about"
              className="input resize-none"
              rows="3"
              maxLength="500"
            />
            <div className="text-sm text-gray-500 mt-1">
              {description.length}/500 characters
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={handleCategoryChange}
              className="input"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="relative">
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={handleTagsChange}
                placeholder="Add tags separated by commas"
                className="input pl-10"
                maxLength="200"
              />
              <FiHash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {tags.length}/200 characters
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !title.trim() || !video || !category}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create AFEXClip'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClip; 