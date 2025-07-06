import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const NewConfessionModal = ({ isOpen, onClose, onConfessionPosted }) => {
  const { user } = useAuth();
  const [confessionText, setConfessionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confessionText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/confessions', {
        text: confessionText.trim()
      });
      
      setConfessionText('');
      onClose();
      if (onConfessionPosted) {
        onConfessionPosted(response.data);
      }
    } catch (error) {
      console.error('Error posting confession:', error);
      alert('Failed to post confession. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Write a Confession
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Anonymous Confession
            </label>
            <textarea
              value={confessionText}
              onChange={(e) => setConfessionText(e.target.value)}
              placeholder="Share what's on your mind... (completely anonymous)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={6}
              maxLength={1000}
              required
            />
            <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">
              {confessionText.length}/1000
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <div className="text-blue-600 dark:text-blue-400 text-lg mr-2">🔒</div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">100% Anonymous</p>
                <p>Your identity will never be revealed. Share freely!</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confessionText.trim() || isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Posting...' : 'Post Confession'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConfessionModal; 