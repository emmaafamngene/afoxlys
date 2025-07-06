import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiX, FiUser } from 'react-icons/fi';
import DefaultAvatar from '../DefaultAvatar';
import { getAvatarUrl } from '../../utils/avatarUtils';

const SwipeCard = ({ post, onVote, onNext }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [showVoteAnimation, setShowVoteAnimation] = useState(null);
  const [animationPhase, setAnimationPhase] = useState('idle');

  const handleVote = async (voteType) => {
    if (isVoting) return;
    
    setIsVoting(true);
    setShowVoteAnimation(voteType);
    setAnimationPhase('start');
    
    try {
      // Map frontend voteType to backend
      const backendVoteType = voteType === 'like' ? 'hot' : 'not';
      await onVote(backendVoteType, post);
      
      // Start exit animation
      setTimeout(() => {
        setAnimationPhase('exit');
        setTimeout(() => {
          setShowVoteAnimation(null);
          setAnimationPhase('idle');
          setIsVoting(false);
        }, 300);
      }, 800);
      
    } catch (error) {
      console.error('Error voting:', error);
      setShowVoteAnimation(null);
      setAnimationPhase('idle');
      setIsVoting(false);
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

  const hasMedia = post.media && post.media.length > 0;
  const avatarUrl = getAvatarUrl(post.author?.avatar);

  return (
    <div className="relative max-w-md mx-auto">
      {/* Enhanced Vote Animation Overlay */}
      {showVoteAnimation && (
        <>
          {/* Background Overlay */}
          <div className={`absolute inset-0 z-30 rounded-xl overflow-hidden ${
            animationPhase === 'start' ? 'animate-pulse' : ''
          }`}>
            <div className={`absolute inset-0 transition-all duration-500 ${
              showVoteAnimation === 'like' 
                ? 'bg-gradient-to-br from-green-400 via-green-500 to-green-600' 
                : 'bg-gradient-to-br from-red-400 via-red-500 to-red-600'
            } ${animationPhase === 'exit' ? 'opacity-0 scale-110' : 'opacity-90'}`} />
          </div>

          {/* Main Animation Content */}
          <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center transition-all duration-500 ${
            animationPhase === 'exit' ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
          }`}>
            {/* Large Icon */}
            <div className={`text-8xl mb-4 transition-all duration-300 ${
              animationPhase === 'start' ? 'animate-vote-bounce' : ''
            }`}>
              {showVoteAnimation === 'like' ? '🔥' : '❌'}
            </div>

            {/* Vote Text */}
            <div className="text-center">
              <h2 className={`text-4xl font-bold text-white mb-2 transition-all duration-300 ${
                animationPhase === 'start' ? 'animate-vote-pulse' : ''
              }`}>
                {showVoteAnimation === 'like' ? 'HOT!' : 'NOT HOT'}
              </h2>
              <p className="text-white text-lg opacity-90">
                {showVoteAnimation === 'like' ? 'This post is fire! 🔥' : 'This post is not it...'}
              </p>
            </div>

            {/* Particle Effects */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full ${
                    showVoteAnimation === 'like' ? 'bg-yellow-300' : 'bg-red-300'
                  } animate-particle-float`}
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1.5s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Success Checkmark */}
          {animationPhase === 'start' && (
            <div className="absolute top-4 right-4 z-50">
              <div className="bg-white rounded-full p-2 shadow-lg animate-success-check">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Card */}
      <div className={`swipe-card bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        showVoteAnimation ? 'transform scale-105' : 'hover:shadow-xl hover:-translate-y-1'
      }`}>
        {/* Media or Text Content */}
        {hasMedia ? (
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
            <img
              src={post.media[0]?.url || post.mediaUrl}
              alt="Post content"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500" style={{ display: 'none' }}>
              <div className="text-center">
                <div className="text-6xl mb-2">📷</div>
                <p className="text-sm">Image not available</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 p-8 min-h-[300px] flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                Text Post
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Swipe to vote on this text-based post
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {/* User Info */}
          <div className="flex items-center mb-3">
            <Link to={`/profile/${post.author?.username}`} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={post.author?.username}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <DefaultAvatar 
                username={post.author?.username} 
                size={32}
                style={{ display: avatarUrl ? 'none' : 'block' }}
              />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {post.author?.username || 'Anonymous'}
              </span>
            </Link>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
              {post.content || post.text || 'No content available'}
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
              className="vote-button flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
            >
              <FiX className="w-5 h-5" />
              <span>Not Hot</span>
            </button>
            <button
              onClick={() => handleVote('like')}
              disabled={isVoting}
              className="vote-button flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
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