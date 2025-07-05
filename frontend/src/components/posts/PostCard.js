import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { likesAPI, commentsAPI } from '../../services/api';
import { FiHeart, FiMessageCircle, FiShare, FiMoreHorizontal, FiPlay, FiEye } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { DefaultAvatar } from '../layout/AFEXLogo';
import CommentSection from '../comments/CommentSection';

const PostCard = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.likes?.some(like => like._id === user?._id) || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || post.likes?.length || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like posts');
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
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentCountChange = (newCount) => {
    setCommentCount(newCount);
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
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to={`/user/${post.author._id}`} className="group">
              {post.author.avatar ? (
                <div className="relative">
                  <img
                    src={post.author.avatar}
                    alt={post.author.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <DefaultAvatar 
                    user={post.author} 
                    size="md" 
                    className="hidden group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ) : (
                <DefaultAvatar 
                  user={post.author} 
                  size="md"
                  className="group-hover:scale-110 transition-transform duration-300"
                />
              )}
            </Link>
            <div>
              <Link 
                to={`/user/${post.author._id}`}
                className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-lg"
              >
                {post.author.firstName} {post.author.lastName}
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{post.author.username}</p>
            </div>
          </div>
          <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiMoreHorizontal className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="p-6">
        <p className="text-gray-900 dark:text-white mb-6 leading-relaxed text-lg">
          {post.content}
        </p>

        {/* Enhanced Media */}
        {post.media && (
          <div className="mb-6 max-w-md mx-auto">
            {post.media.type?.startsWith('image/') ? (
              <div className="relative group">
                <img
                  src={post.media.url}
                  alt="Post media"
                  className="w-full rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-2xl transition-all duration-300"></div>
              </div>
            ) : post.media.type?.startsWith('video/') ? (
              <div className="relative group">
                <video
                  src={post.media.url}
                  controls
                  className="w-full rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300"
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
                    <button className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition-all shadow-lg hover:shadow-xl">
                      <FiPlay className="w-8 h-8 text-gray-900" />
                    </button>
                  </div>
                )}
                {post.media.duration && (
                  <div className="absolute bottom-3 right-3 bg-black bg-opacity-80 text-white text-sm px-3 py-1 rounded-full font-medium">
                    {formatDuration(post.media.duration)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 rounded-2xl transition-all duration-300"></div>
              </div>
            ) : null}
          </div>
        )}

        {/* Enhanced Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 text-sm rounded-full font-medium shadow-sm hover:shadow-md transition-all duration-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Enhanced Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <FiEye className="w-5 h-5" />
              <span className="font-medium">{post.views || 0} views</span>
            </div>
            <span className="font-medium">{formatDate(post.createdAt)}</span>
          </div>
        </div>

        {/* Enhanced Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-8">
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
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-3 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors transform hover:scale-105"
            >
              <FiMessageCircle className="w-6 h-6" />
              <span className="font-bold text-lg">{commentCount}</span>
            </button>
          </div>

          <button
            onClick={handleShare}
            className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transform hover:scale-105"
          >
            <FiShare className="w-6 h-6" />
          </button>
        </div>

        {/* Enhanced Comment Section */}
        {showComments && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <CommentSection 
              postId={post._id}
              commentCount={commentCount}
              onCommentCountChange={handleCommentCountChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard; 