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
    <div className="space-y-6">
      {/* Enhanced Comment Input */}
      <div className="flex space-x-4">
        {user?.avatar ? (
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <DefaultAvatar 
              user={user} 
              size="md" 
              className="hidden"
            />
          </div>
        ) : (
          <DefaultAvatar user={user} size="md" />
        )}
        <div className="flex-1">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-4 pr-16 border-2 border-gray-200 dark:border-gray-700 rounded-2xl resize-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows="3"
              maxLength="500"
            />
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <span className="text-xs text-gray-400">
                {newComment.length}/500
              </span>
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className={`p-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  newComment.trim() && !submitting
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiSend className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Comments List */}
      {showComments && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <div 
                  key={comment._id} 
                  className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex space-x-4">
                    {comment.author.avatar ? (
                      <div className="relative">
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.username}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <DefaultAvatar 
                          user={comment.author} 
                          size="md" 
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <DefaultAvatar user={comment.author} size="md" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <Link 
                            to={`/user/${comment.author._id}`}
                            className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {comment.author.firstName} {comment.author.lastName}
                          </Link>
                          <p className="text-sm text-gray-500 dark:text-gray-400">@{comment.author.username}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                          {user?._id === comment.author._id && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-red-500 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-4">
                <FiMessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Toggle Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md"
        >
          <FiMessageCircle className="w-5 h-5" />
          <span className="font-semibold">
            {showComments ? 'Hide' : 'Show'} Comments ({commentCount})
          </span>
        </button>
      </div>
    </div>
  );
};

export default CommentSection; 