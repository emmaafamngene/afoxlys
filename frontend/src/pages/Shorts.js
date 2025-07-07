import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { shortsAPI } from '../services/api';
import { FiHeart, FiShare2, FiMessageCircle, FiPlus, FiUpload } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import DefaultAvatar from '../components/DefaultAvatar';
import { getAvatarUrl } from '../utils/avatarUtils';

const Shorts = () => {
  const { user } = useAuth();
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [showComments, setShowComments] = useState({});

  useEffect(() => {
    fetchShorts();
  }, []);

  const fetchShorts = async () => {
    try {
      setLoading(true);
      const response = await shortsAPI.getAll();
      setShorts(response.data.shorts || response.data);
    } catch (error) {
      console.error('Error fetching shorts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !caption.trim()) return;

    try {
      setUploading(true);

      // Step 1: Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', 'afex_shorts'); // Custom preset for AFEX shorts

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/dwsnvxcd8/${selectedFile.type.startsWith('video/') ? 'video' : 'image'}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();
      const mediaUrl = cloudinaryData.secure_url;

      // Step 2: Save to MongoDB via your backend
      const response = await shortsAPI.create({
        caption,
        mediaUrl,
        type: selectedFile.type.startsWith('video/') ? 'video' : 'image',
      });

      if (response.data) {
        setShorts(prev => [response.data, ...prev]);
        setShowUploadModal(false);
        setSelectedFile(null);
        setCaption('');
      }
    } catch (error) {
      console.error('Error uploading short:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (shortId) => {
    try {
      const response = await shortsAPI.like(shortId);

      if (response.data) {
        setShorts(prev => prev.map(short => 
          short._id === shortId 
            ? { ...short, isLiked: response.data.isLiked, likes: response.data.likes }
            : short
        ));
      }
    } catch (error) {
      console.error('Error liking short:', error);
    }
  };

  const handleShare = async (shortId) => {
    try {
      await navigator.share({
        title: 'Check out this short!',
        url: `${window.location.origin}/shorts/${shortId}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleComment = async (shortId, comment) => {
    try {
      const response = await shortsAPI.addComment(shortId, comment);

      if (response.data) {
        setShorts(prev => prev.map(short => 
          short._id === shortId 
            ? { ...short, comments: [...short.comments, response.data] }
            : short
        ));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const ShortCard = ({ short, index }) => {
    const [comment, setComment] = useState('');
    const [showCommentInput, setShowCommentInput] = useState(false);

    const isVisible = index === currentIndex;

    return (
      <div className={`relative w-full h-full ${isVisible ? 'block' : 'hidden'}`}>
        {/* Media Content */}
        <div className="relative w-full h-full bg-black">
          {short.type === 'video' ? (
            <video
              src={short.mediaUrl}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              onLoadStart={() => console.log('Video loading...')}
              onError={(e) => console.error('Video error:', e)}
            />
          ) : (
            <img
              src={short.mediaUrl}
              alt={short.caption}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          )}
          
          {/* Fallback for failed media */}
          <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-800" style={{ display: 'none' }}>
            <div className="text-center">
              <div className="text-6xl mb-2">📷</div>
              <p className="text-sm">Media not available</p>
            </div>
          </div>
        </div>

        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          {/* Caption */}
          <p className="text-white text-lg mb-4 font-medium">{short.caption}</p>
          
          {/* User Info */}
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
              {short.author?.avatar ? (
                <img
                  src={getAvatarUrl(short.author.avatar)}
                  alt={short.author.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <DefaultAvatar username={short.author?.username} />
              )}
            </div>
            <span className="text-white font-medium">{short.author?.username}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => handleLike(short._id)}
              className="flex flex-col items-center space-y-1"
            >
              {short.isLiked ? (
                <FaHeart className="w-6 h-6 text-red-500" />
              ) : (
                <FiHeart className="w-6 h-6 text-white" />
              )}
              <span className="text-white text-sm">{short.likes || 0}</span>
            </button>

            <button
              onClick={() => setShowComments(prev => ({ ...prev, [short._id]: !prev[short._id] }))}
              className="flex flex-col items-center space-y-1"
            >
              <FiMessageCircle className="w-6 h-6 text-white" />
              <span className="text-white text-sm">{short.comments?.length || 0}</span>
            </button>

            <button
              onClick={() => handleShare(short._id)}
              className="flex flex-col items-center space-y-1"
            >
              <FiShare2 className="w-6 h-6 text-white" />
              <span className="text-white text-sm">Share</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments[short._id] && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 max-h-64 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-3">Comments</h3>
              
              {/* Comment Input */}
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && comment.trim()) {
                      handleComment(short._id, comment);
                      setComment('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (comment.trim()) {
                      handleComment(short._id, comment);
                      setComment('');
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Post
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {short.comments?.map((comment, index) => (
                  <div key={index} className="flex space-x-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      {comment.author?.avatar ? (
                        <img
                          src={getAvatarUrl(comment.author.avatar)}
                          alt={comment.author.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <DefaultAvatar username={comment.author?.username} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{comment.author?.username}</span>
                        <span className="text-gray-500 text-xs">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading shorts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-2xl font-bold">Shorts</h1>
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center"
          >
            <FiPlus className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>

      {/* Shorts Container */}
      <div className="pt-20 pb-4">
        {shorts.length === 0 ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-2xl font-bold mb-2">No Shorts Yet</h2>
              <p className="text-gray-400 mb-4">Be the first to create a short!</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100"
              >
                Create Short
              </button>
            </div>
          </div>
        ) : (
          <div className="relative h-screen">
            {shorts.map((short, index) => (
              <ShortCard key={short._id} short={short} index={index} />
            ))}
            
            {/* Navigation */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-2">
              {shorts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-4">Create Short</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Media</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="What's happening?"
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows="3"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || !caption.trim() || uploading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shorts; 