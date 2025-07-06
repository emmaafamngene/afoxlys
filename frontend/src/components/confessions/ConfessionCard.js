import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const ConfessionCard = ({ confession, onUpdate }) => {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReaction = async (reactionType) => {
    try {
      const response = await api.post(`/confessions/${confession._id}/react`, {
        reactionType
      });
      
      if (onUpdate) {
        onUpdate(response.data);
      }
    } catch (error) {
      console.error('Error reacting to confession:', error);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await api.post(`/confessions/${confession._id}/reply`, {
        text: newReply.trim()
      });
      
      setNewReply('');
      if (onUpdate) {
        onUpdate(response.data);
      }
    } catch (error) {
      console.error('Error replying to confession:', error);
    } finally {
      setIsSubmitting(false);
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

  const reactionEmojis = {
    fire: '🔥',
    cry: '😭',
    love: '❤️',
    laugh: '😂',
    heart: '💖'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4 border border-gray-200 dark:border-gray-700">
      {/* Confession Text */}
      <div className="mb-4">
        <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
          "{confession.text}"
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          {formatTime(confession.createdAt)}
        </p>
      </div>

      {/* Emoji Reactions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(confession.emojiReactions).map(([type, count]) => (
          count > 0 && (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-lg">{reactionEmojis[type]}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{count}</span>
            </button>
          )
        ))}
      </div>

      {/* Add Reaction Buttons */}
      <div className="flex gap-2 mb-4">
        {Object.entries(reactionEmojis).map(([type, emoji]) => (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            className="text-2xl hover:scale-110 transition-transform"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Replies Section */}
      {confession.replies && confession.replies.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
          >
            {showReplies ? 'Hide' : `Show`} {confession.replies.length} {confession.replies.length === 1 ? 'reply' : 'replies'}
          </button>
          
          {showReplies && (
            <div className="mt-3 space-y-3">
              {confession.replies.map((reply, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    "{reply.text}"
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    {formatTime(reply.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Reply Form */}
      <form onSubmit={handleReply} className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder="Add an anonymous reply..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newReply.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Sending...' : 'Reply'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfessionCard; 