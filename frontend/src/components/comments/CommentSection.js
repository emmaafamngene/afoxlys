import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { commentsAPI, likesAPI } from '../../services/api';
import { FiMessageCircle, FiHeart, FiTrash2, FiMoreVertical, FiSend, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { DefaultAvatar } from '../layout/AFEXLogo';
import { Link } from 'react-router-dom';

const CommentSection = ({ postId, commentCount, onCommentCountChange }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  // Pre-load comments when component mounts
  useEffect(() => {
    if (postId && !commentsLoaded) {
      fetchComments();
    }
  }, [postId, commentsLoaded]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await commentsAPI.getPostComments(postId);
      setComments(response.data.comments);
      setCommentsLoaded(true);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComments = () => {
    setShowComments(!showComments);
    // If comments haven't been loaded yet, load them now
    if (!commentsLoaded && !loading) {
      fetchComments();
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      const response = await commentsAPI.addPostComment(postId, { content: newComment });
      setComments(prev => [response.data.comment, ...prev]);
      setNewComment('');
      
      if (onCommentCountChange) {
        onCommentCountChange(comments.length + 1);
      }
      
      toast.success('Comment posted successfully!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const response = await commentsAPI.updateComment(commentId, { content: editText });
      setComments(prev => 
        prev.map(comment => 
          comment._id === commentId 
            ? { ...comment, content: editText, isEdited: true }
            : comment
        )
      );
      setEditingComment(null);
      setEditText('');
      toast.success('Comment updated successfully!');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await commentsAPI.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment._id !== commentId));
      
      if (onCommentCountChange) {
        onCommentCountChange(comments.length - 1);
      }
      
      toast.success('Comment deleted successfully!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await likesAPI.toggleCommentLike(commentId);
      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            isLiked: response.data.liked,
            likeCount: response.data.liked ? comment.likeCount + 1 : comment.likeCount - 1
          };
        }
        return comment;
      }));
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now - commentDate) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return commentDate.toLocaleDateString();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Comment Input */}
      <div className="flex space-x-3 sm:space-x-4">
        {user?.avatar ? (
          <div className="relative flex-shrink-0">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <DefaultAvatar username={user.username} size={40} />
          </div>
        ) : (
          <div className="flex-shrink-0">
            <DefaultAvatar username={user.username} size={40} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-3 sm:p-4 pr-16 border-2 border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl resize-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
              rows="3"
              maxLength="500"
            />
            <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center space-x-1 sm:space-x-2">
              <span className="text-xs text-gray-400">
                {newComment.length}/500
              </span>
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  newComment.trim() && !submitting
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {showComments && (
        <div className="space-y-4 sm:space-y-6">
          {loading ? (
            <div className="flex justify-center py-4 sm:py-6">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment._id} className="flex space-x-3 sm:space-x-4">
                <Link to={`/user/${comment.author._id}`} className="flex-shrink-0">
                  {comment.author.avatar ? (
                    <div className="relative">
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.username}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <DefaultAvatar username={comment.author.username} size={40} />
                    </div>
                  ) : (
                    <DefaultAvatar username={comment.author.username} size={40} />
                  )}
                </Link>
                
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <Link 
                          to={`/user/${comment.author._id}`}
                          className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block"
                        >
                          {comment.author.firstName} {comment.author.lastName}
                        </Link>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                          @{comment.author.username}
                        </p>
                      </div>
                      
                      {user && (user._id === comment.author._id || user.role === 'admin') && (
                        <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                          <button
                            onClick={() => {
                              setEditingComment(comment._id);
                              setEditText(comment.content);
                            }}
                            className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1 rounded"
                          >
                            <FiEdit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded"
                          >
                            <FiTrash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {editingComment === comment._id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                          rows="2"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditComment(comment._id)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingComment(null);
                              setEditText('');
                            }}
                            className="px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm sm:text-base text-gray-900 dark:text-white mb-2 leading-relaxed">
                          {comment.content}
                          {comment.isEdited && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(edited)</span>
                          )}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => handleLikeComment(comment._id)}
                              className={`flex items-center space-x-1 text-xs sm:text-sm transition-colors ${
                                comment.isLiked 
                                  ? 'text-red-500' 
                                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                              }`}
                            >
                              <FiHeart className={`w-3 h-3 sm:w-4 sm:h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                              <span>{comment.likeCount || 0}</span>
                            </button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 sm:py-8">
              <FiMessageCircle className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection; 