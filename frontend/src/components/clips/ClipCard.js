import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { likesAPI } from '../../services/api';
import { FiHeart, FiMessageCircle, FiShare, FiPlay, FiEye, FiClock, FiPause } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { DefaultAvatar } from '../layout/AFEXLogo';

const ClipCard = ({ clip, onUpdate }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(clip.likes?.some(like => like._id === user?._id) || false);
  const [likeCount, setLikeCount] = useState(clip.likeCount || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const videoRef = useRef(null);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like clips');
      return;
    }

    try {
      const response = await likesAPI.toggleClipLike(clip._id);
      setIsLiked(response.data.liked);
      setLikeCount(prev => response.data.liked ? prev + 1 : prev - 1);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      toast.error('Failed to like clip');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/clip/${clip._id}`);
    toast.success('Link copied to clipboard!');
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
    setShowOverlay(false);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800 group">
      {/* Video Container - Instagram-like aspect ratio */}
      <div 
        className="relative bg-gray-100 dark:bg-gray-800 cursor-pointer" 
        style={{ aspectRatio: '9/16' }}
        onClick={handleVideoClick}
        onMouseEnter={() => !isPlaying && setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
      >
        <video
          ref={videoRef}
          src={clip.videoUrl}
          poster={clip.thumbnailUrl}
          className="w-full h-full object-cover"
          preload="metadata"
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onEnded={() => setIsPlaying(false)}
          loop
          muted
        />
        
        {/* Play/Pause Overlay */}
        {showOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity">
            <button className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition-all transform scale-110">
              {isPlaying ? (
                <FiPause className="w-8 h-8 text-gray-900" />
              ) : (
                <FiPlay className="w-8 h-8 text-gray-900" />
              )}
            </button>
          </div>
        )}

        {/* Play/Pause Button when video is playing */}
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button 
              className="bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                handleVideoClick();
              }}
            >
              <FiPause className="w-6 h-6 text-white" />
            </button>
          </div>
        )}

        {/* Duration Badge */}
        {clip.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(clip.duration)}
          </div>
        )}

        {/* Views Badge */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
          <FiEye className="w-3 h-3" />
          <span>{clip.views || 0}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Link to={`/user/${clip.author._id}`}>
              {clip.author.avatar ? (
                <div className="relative">
                  <img
                    src={clip.author.avatar}
                    alt={clip.author.username}
                    className="w-10 h-10 rounded-full object-cover border border-white dark:border-gray-800 shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <DefaultAvatar 
                    user={clip.author} 
                    size="sm" 
                    className="hidden"
                  />
                </div>
              ) : (
                <DefaultAvatar 
                  user={clip.author} 
                  size="sm"
                />
              )}
            </Link>
            <div>
              <Link 
                to={`/user/${clip.author._id}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {clip.author.firstName} {clip.author.lastName}
              </Link>
              <p className="text-xs text-gray-500 dark:text-gray-400">@{clip.author.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <FiClock className="w-3 h-3" />
            <span>{formatDate(clip.createdAt)}</span>
          </div>
        </div>

        {/* Title and Description */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {clip.title}
          </h3>
          {clip.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {clip.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {clip.tags && clip.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {clip.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-all duration-200 ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              {isLiked ? (
                <FaHeart className="w-5 h-5" />
              ) : (
                <FiHeart className="w-5 h-5" />
              )}
              <span className="font-semibold">{likeCount}</span>
            </button>
            
            <Link
              to={`/clip/${clip._id}`}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <FiMessageCircle className="w-5 h-5" />
              <span className="font-semibold">{clip.commentCount || 0}</span>
            </Link>
          </div>

          <button
            onClick={handleShare}
            className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FiShare className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClipCard; 