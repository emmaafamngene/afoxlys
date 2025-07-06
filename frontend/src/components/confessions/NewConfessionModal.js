import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FiX, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

const NewConfessionModal = ({ isOpen, onClose, onConfessionPosted }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please write a confession');
      return;
    }

    if (!user) {
      toast.error('Please login to post confessions');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/confessions', {
        content: content.trim()
      });
      
      setContent('');
      onClose();
      
      if (onConfessionPosted) {
        onConfessionPosted(response.data);
      }
      
      toast.success('Confession posted successfully!');
    } catch (error) {
      console.error('Error posting confession:', error);
      toast.error('Failed to post confession');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">💖</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Write a Confession
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Anonymous Confession
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, feelings, or secrets anonymously..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              rows="6"
              maxLength={1000}
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your confession will be completely anonymous
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {content.length}/1000
              </span>
            </div>
          </div>

          {/* Guidelines */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              💡 Guidelines:
            </h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Be respectful and kind to others</li>
              <li>• No hate speech or harmful content</li>
              <li>• Keep it anonymous and safe</li>
              <li>• Share from the heart 💖</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              <FiSend className="w-4 h-4" />
              <span>{isSubmitting ? 'Posting...' : 'Post Confession'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConfessionModal; 