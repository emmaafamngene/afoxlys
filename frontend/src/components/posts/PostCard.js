import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { likesAPI } from '../../services/api';
import { FiHeart, FiMessageCircle, FiMoreVertical, FiShare, FiPlay, FiEye } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import CommentSection from '../comments/CommentSection';
import DefaultAvatar from '../DefaultAvatar';
import { getAvatarUrl } from '../../utils/avatarUtils';

const PostCard = ({ post, onUpdate, compact = false }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.likes?.some(like => like._id === user?._id) || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || post.likes?.length || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || (post.comments ? post.comments.length : 0));
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('PostCard render - post:', post._id, 'commentCount:', post.commentCount, 'comments array:', post.comments);
  }, [post]);

  // Update comment count when post data changes
  useEffect(() => {
    const newCommentCount = post.commentCount || (post.comments ? post.comments.length : 0);
    setCommentCount(newCommentCount);
  }, [post.commentCount, post.comments]);

  const handleLike = async () => {
    if (!user) {
      console.log('Please login to like posts');
      return;
    }

    if (isLiking) return; // Prevent double clicking

    try {
      setIsLiking(true);
      const response = await likesAPI.togglePostLike(post._id);
      setIsLiked(response.data.liked);
      setLikeCount(response.data.likeCount || (response.data.liked ? likeCount + 1 : likeCount - 1));
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Like error:', error);
      console.log('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentCountChange = (newCount) => {
    setCommentCount(newCount);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
    console.log('Link copied to clipboard!');
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
    <div className={`bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all duration-300 ${compact ? '' : 'transform hover:-translate-y-1'}`}>
      {/* Header */}
      <div className={`${compact ? 'p-3' : 'p-4 sm:p-6'} border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900`}>
        <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4">
              <Link to={`/user/${post.author._id}`} className="group">
                {post.author.avatar ? (
                  <div className="relative">
                    <img
                      src={getAvatarUrl(post.author.avatar)}
                      alt={post.author.username}
                      className={`${compact ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <DefaultAvatar 
                      username={post.author.username} 
                      size={compact ? 32 : 48}
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <DefaultAvatar 
                    username={post.author.username} 
                    size={compact ? 32 : 48}
                  />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link 
                  to={`/user/${post.author._id}`}
                  className={`font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}
                >
                  {post.author.firstName} {post.author.lastName}
                </Link>
                <p className={`text-gray-500 dark:text-gray-400 truncate ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>@{post.author.username}</p>
              </div>
            </div>
          <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0">
            <FiMoreVertical className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`${compact ? 'p-3' : 'p-4 sm:p-6'}`}>
        <p className={`text-gray-900 dark:text-white ${compact ? 'mb-3 text-sm' : 'mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base lg:text-lg'} line-clamp-3`}>
          {post.content}
        </p>

        {/* Media */}
        {post.media && (
          <div className="mb-4 sm:mb-6 max-w-full mx-auto">
            {post.media.type?.startsWith('image/') ? (
              <div className="relative group">
                <img
                  src={post.media.url}
                  alt="Post media"
                  className="w-full rounded-xl sm:rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-xl sm:rounded-2xl transition-all duration-300"></div>
              </div>
            ) : post.media.type?.startsWith('video/') ? (
              <div className="relative group">
                <video
                  src={post.media.url}
                  controls
                  className="w-full rounded-xl sm:rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300"
                  preload="metadata"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadedMetadata={(e) => {
                    // Fix video player issues
                    if (e.target.duration) {
                      e.target.currentTime = 0;
                    }
                  }}
                />
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-white bg-opacity-90 rounded-full p-3 sm:p-4 hover:bg-opacity-100 transition-all shadow-lg hover:shadow-xl">
                      <FiPlay className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900" />
                    </button>
                  </div>
                )}
                {post.media.duration && (
                  <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 bg-black bg-opacity-80 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-medium">
                    {formatDuration(post.media.duration)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 rounded-xl sm:rounded-2xl transition-all duration-300"></div>
              </div>
            ) : null}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 text-xs sm:text-sm rounded-full font-medium shadow-sm hover:shadow-md transition-all duration-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium">{post.views || 0} views</span>
            </div>
            <span className="font-medium">{formatDate(post.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-2 p-2 sm:p-3 rounded-xl transition-all duration-200 ${
                isLiked 
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {isLiked ? (
                <FaHeart className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <FiHeart className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
              <span className="text-sm sm:text-base font-medium">{likeCount}</span>
            </button>

            <button
              onClick={() => {
                console.log('Comment button clicked, current showComments:', showComments, 'commentCount:', commentCount);
                setShowComments(!showComments);
              }}
              className="flex items-center space-x-2 p-2 sm:p-3 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
            >
              <FiMessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-sm sm:text-base font-medium">{commentCount}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 p-2 sm:p-3 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
            >
              <FiShare className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-sm sm:text-base font-medium">Share</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-800">
            <CommentSection 
              postId={post._id} 
              onCommentCountChange={handleCommentCountChange}
              commentCount={commentCount}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard; 