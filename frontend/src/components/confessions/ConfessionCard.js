import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FiHeart, FiMessageCircle, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ConfessionCard = ({ confession, onUpdate }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(confession.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(confession.likes?.length || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(confession.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like confessions');
      return;
    }

    try {
      const response = await api.post(`/confessions/${confession._id}/like`);
      setIsLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
      
      if (onUpdate) {
        onUpdate({
          ...confession,
          likes: response.data.likes
        });
      }
    } catch (error) {
      console.error('Error liking confession:', error);
      toast.error('Failed to like confession');
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Confession cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.put(`/confessions/${confession._id}`, {
        content: editContent
      });
      
      if (onUpdate) {
        onUpdate(response.data);
      }
      
      setIsEditing(false);
      toast.success('Confession updated successfully');
    } catch (error) {
      console.error('Error updating confession:', error);
      toast.error('Failed to update confession');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm('Are you sure you want to delete this confession?')) {
      return;
    }

    try {
      await api.delete(`/confessions/${confession._id}`);
      toast.success('Confession deleted successfully');
      // You might want to add a callback to remove from parent state
    } catch (error) {
      console.error('Error deleting confession:', error);
      toast.error('Failed to delete confession');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">💖</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Anonymous Confession
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(confession.createdAt)}
            </p>
          </div>
        </div>
        
        {user?._id === confession.userId && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <FiMoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                >
                  <FiEdit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Write your confession..."
            />
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(confession.content);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
            {confession.content}
          </p>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
              isLiked
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            <FiHeart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likeCount}</span>
          </button>
          
          <div className="flex items-center space-x-1 text-gray-500">
            <FiMessageCircle className="w-4 h-4" />
            <span className="text-sm">0</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfessionCard; 