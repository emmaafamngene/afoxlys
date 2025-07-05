import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { likesAPI, commentsAPI } from '../../services/api';
import { FiHeart, FiMessageCircle, FiShare, FiMoreHorizontal, FiPlay, FiEye } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { DefaultAvatar } from '../layout/AFEXLogo';

const PostCard = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.likes?.some(like => like._id === user?._id) || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    try {
      const response = await likesAPI.togglePostLike(post._id);
      setIsLiked(response.data.liked);
      setLikeCount(prev => response.data.liked ? prev + 1 : prev - 1);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
    toast.success('Link copied to clipboard!');
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

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to={`/user/${post.author._id}`}>
              {post.author.avatar ? (
                <div className="relative">
                  <img
                    src={post.author.avatar}
                    alt={post.author.username}
                    className="w-10 h-10 rounded-full object-cover border border-white dark:border-gray-800 shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <DefaultAvatar 
                    user={post.author} 
                    size="sm" 
                    className="hidden"
                  />
                </div>
              ) : (
                <DefaultAvatar 
                  user={post.author} 
                  size="sm"
                />
              )}
            </Link>
            <div>
              <Link 
                to={`/user/${post.author._id}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {post.author.firstName} {post.author.lastName}
              </Link>
              <p className="text-xs text-gray-500 dark:text-gray-400">@{post.author.username}</p>
            </div>
          </div>
          <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <FiMoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-900 dark:text-white mb-4 leading-relaxed">
          {post.content}
        </p>

        {/* Media */}
        {post.media && (
          <div className="mb-4">
            {post.media.type?.startsWith('image/') ? (
              <img
                src={post.media.url}
                alt="Post media"
                className="w-full rounded-lg shadow-sm"
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : post.media.type?.startsWith('video/') ? (
              <div className="relative">
                <video
                  src={post.media.url}
                  controls
                  className="w-full rounded-lg shadow-sm"
                  preload="metadata"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100 transition-all">
                      <FiPlay className="w-6 h-6 text-gray-900" />
                    </button>
                  </div>
                )}
                {post.media.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(post.media.duration)}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {post.media.name || 'Attachment'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FiEye className="w-4 h-4" />
              <span>{post.views || 0} views</span>
            </div>
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-6">
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
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <FiMessageCircle className="w-5 h-5" />
              <span className="font-semibold">{commentCount}</span>
            </button>
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

export default PostCard; 