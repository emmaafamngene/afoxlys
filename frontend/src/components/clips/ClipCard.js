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
  const [likeCount, setLikeCount] = useState(clip.likeCount || clip.likes?.length || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const videoRef = useRef(null);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like clips');
      return;
    }

    if (isLiking) return; // Prevent double clicking

    try {
      setIsLiking(true);
      const response = await likesAPI.toggleClipLike(clip._id);
      setIsLiked(response.data.liked);
      setLikeCount(response.data.likeCount || (response.data.liked ? likeCount + 1 : likeCount - 1));
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to like clip');
    } finally {
      setIsLiking(false);
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
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800 group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
      {/* Enhanced Video Container - Instagram-like aspect ratio */}
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
          onLoadedMetadata={(e) => {
            // Fix video player issues
            if (e.target.duration) {
              e.target.currentTime = 0;
            }
          }}
          loop
          muted
        />
        
        {/* Enhanced Play/Pause Overlay */}
        {showOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity">
            <button className="bg-white bg-opacity-90 rounded-full p-5 hover:bg-opacity-100 transition-all transform scale-110 shadow-xl hover:shadow-2xl">
              {isPlaying ? (
                <FiPause className="w-10 h-10 text-gray-900" />
              ) : (
                <FiPlay className="w-10 h-10 text-gray-900" />
              )}
            </button>
          </div>
        )}

        {/* Enhanced Play/Pause Button when video is playing */}
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button 
              className="bg-black bg-opacity-50 rounded-full p-4 hover:bg-opacity-70 transition-all shadow-lg hover:shadow-xl"
              onClick={(e) => {
                e.stopPropagation();
                handleVideoClick();
              }}
            >
              <FiPause className="w-8 h-8 text-white" />
            </button>
          </div>
        )}

        {/* Enhanced Duration Badge */}
        {clip.duration && (
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-80 text-white text-sm px-3 py-1 rounded-full font-medium">
            {formatDuration(clip.duration)}
          </div>
        )}

        {/* Enhanced Views Badge */}
        <div className="absolute bottom-3 left-3 bg-black bg-opacity-80 text-white text-sm px-3 py-1 rounded-full flex items-center space-x-2 font-medium">
          <FiEye className="w-4 h-4" />
          <span>{clip.views || 0}</span>
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="p-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link to={`/user/${clip.author._id}`} className="group">
              {clip.author.avatar ? (
                <div className="relative">
                  <img
                    src={clip.author.avatar}
                    alt={clip.author.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <DefaultAvatar 
                    user={clip.author} 
                    size="md" 
                    className="hidden group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ) : (
                <DefaultAvatar 
                  user={clip.author} 
                  size="md"
                  className="group-hover:scale-110 transition-transform duration-300"
                />
              )}
            </Link>
            <div>
              <Link 
                to={`/user/${clip.author._id}`}
                className="font-bold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-lg"
              >
                {clip.author.firstName} {clip.author.lastName}
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{clip.author.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <FiClock className="w-4 h-4" />
            <span className="font-medium">{formatDate(clip.createdAt)}</span>
          </div>
        </div>

        {/* Enhanced Title and Description */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 text-lg">
            {clip.title}
          </h3>
          {clip.description && (
            <p className="text-gray-600 dark:text-gray-400 line-clamp-2 text-base leading-relaxed">
              {clip.description}
            </p>
          )}
        </div>

        {/* Enhanced Tags */}
        {clip.tags && clip.tags.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            {clip.tags.map((tag, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-700 dark:text-purple-300 text-sm rounded-full font-medium shadow-sm hover:shadow-md transition-all duration-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Enhanced Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-3 transition-all duration-300 transform hover:scale-105 ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500'
              } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLiked ? (
                <FaHeart className="w-6 h-6" />
              ) : (
                <FiHeart className="w-6 h-6" />
              )}
              <span className="font-bold text-lg">{likeCount}</span>
            </button>
            
            <Link
              to={`/clip/${clip._id}`}
              className="flex items-center space-x-3 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors transform hover:scale-105"
            >
              <FiMessageCircle className="w-6 h-6" />
              <span className="font-bold text-lg">{clip.commentCount || 0}</span>
            </Link>
          </div>

          <button
            onClick={handleShare}
            className="text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transform hover:scale-105"
          >
            <FiShare className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClipCard; 