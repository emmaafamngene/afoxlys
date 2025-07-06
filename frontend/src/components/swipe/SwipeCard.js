import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import DefaultAvatar from '../DefaultAvatar';

const SwipeCard = ({ post, onVote, onNext }) => {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [voteDirection, setVoteDirection] = useState(null);

  const handleVote = async (voteType) => {
    if (isVoting) return;
    
    setIsVoting(true);
    setVoteDirection(voteType);
    
    try {
      await api.post('/swipe/vote', {
        postId: post._id,
        voteType
      });
      
      // Call parent callback
      if (onVote) {
        onVote(voteType, post);
      }
      
      // Show vote animation briefly
      setTimeout(() => {
        if (onNext) {
          onNext();
        }
      }, 500);
      
    } catch (error) {
      console.error('Error voting:', error);
      setIsVoting(false);
      setVoteDirection(null);
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
    <div className="relative w-full max-w-sm mx-auto">
      {/* Post Card */}
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
        voteDirection === 'hot' ? 'transform -translate-x-full opacity-0' :
        voteDirection === 'not' ? 'transform translate-x-full opacity-0' : ''
      }`}>
        {/* Media */}
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
          {post.mediaUrl ? (
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="hidden w-full h-full items-center justify-center text-gray-400">
            <span className="text-4xl">📷</span>
          </div>
        </div>
        
        {/* Post Info */}
        <div className="p-4">
          {/* User Info */}
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
              {post.userId?.avatar ? (
                <img
                  src={post.userId.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="hidden w-full h-full items-center justify-center bg-gray-200 dark:bg-gray-600">
                <DefaultAvatar 
                  username={post.userId?.username || 'User'} 
                  size={40}
                />
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {post.userId?.firstName || post.userId?.username || 'Anonymous'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatTime(post.createdAt)}
              </p>
            </div>
          </div>
          
          {/* Caption */}
          {post.caption && (
            <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
              {post.caption}
            </p>
          )}
          
          {/* Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {post.score || 0}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hot votes
            </p>
          </div>
        </div>
      </div>
      
      {/* Vote Buttons */}
      <div className="flex justify-between items-center mt-6 px-4">
        <button
          onClick={() => handleVote('not')}
          disabled={isVoting}
          className="w-16 h-16 rounded-full bg-red-500 text-white text-3xl flex items-center justify-center hover:bg-red-600 disabled:opacity-50 transition-all duration-200 shadow-lg hover:scale-110"
        >
          👎
        </button>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Swipe to vote
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            🔥 Hot or 👎 Not
          </p>
        </div>
        
        <button
          onClick={() => handleVote('hot')}
          disabled={isVoting}
          className="w-16 h-16 rounded-full bg-green-500 text-white text-3xl flex items-center justify-center hover:bg-green-600 disabled:opacity-50 transition-all duration-200 shadow-lg hover:scale-110"
        >
          🔥
        </button>
      </div>
      
      {/* Vote Animation Overlay */}
      {voteDirection && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`text-8xl animate-bounce ${
            voteDirection === 'hot' ? 'text-green-500' : 'text-red-500'
          }`}>
            {voteDirection === 'hot' ? '🔥' : '👎'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipeCard; 