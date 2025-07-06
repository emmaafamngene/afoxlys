import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiX, FiUser } from 'react-icons/fi';
import DefaultAvatar from '../DefaultAvatar';

const SwipeCard = ({ post, onVote, onNext }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [showVoteAnimation, setShowVoteAnimation] = useState(null);

  const handleVote = async (voteType) => {
    if (isVoting) return;
    
    setIsVoting(true);
    setShowVoteAnimation(voteType);
    
    try {
      await onVote(voteType, post);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
      setShowVoteAnimation(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'ArrowLeft') {
      handleVote('dislike');
    } else if (e.key === 'ArrowRight') {
      handleVote('like');
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!post) return null;

  return (
    <div className="relative max-w-md mx-auto">
      {/* Vote Animation Overlay */}
      {showVoteAnimation && (
        <div className={`absolute inset-0 z-20 flex items-center justify-center text-6xl font-bold ${
          showVoteAnimation === 'like' 
            ? 'bg-green-500 bg-opacity-80 text-white' 
            : 'bg-red-500 bg-opacity-80 text-white'
        }`}>
          {showVoteAnimation === 'like' ? '❤️' : '❌'}
        </div>
      )}

      {/* Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Media */}
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
          {post.media && post.media.length > 0 ? (
            <img
              src={post.media[0]}
              alt="Post content"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500" style={{ display: post.media && post.media.length > 0 ? 'none' : 'flex' }}>
            <div className="text-center">
              <div className="text-6xl mb-2">📝</div>
              <p className="text-sm">Text Post</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* User Info */}
          <div className="flex items-center mb-3">
            <Link to={`/profile/${post.author.username}`} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.username}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <DefaultAvatar 
                username={post.author.username} 
                size={32}
                style={{ display: post.author.avatar ? 'none' : 'block' }}
              />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {post.author.username}
              </span>
            </Link>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center space-x-4">
              <span>❤️ {post.likes?.length || 0}</span>
              <span>💬 {post.comments?.length || 0}</span>
            </div>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Vote Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => handleVote('dislike')}
              disabled={isVoting}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiX className="w-5 h-5" />
              <span>Not Hot</span>
            </button>
            <button
              onClick={() => handleVote('like')}
              disabled={isVoting}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiHeart className="w-5 h-5" />
              <span>Hot!</span>
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>Use arrow keys: ← Not Hot | → Hot!</p>
      </div>
    </div>
  );
};

export default SwipeCard; 