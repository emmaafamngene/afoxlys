import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { commentsAPI, likesAPI } from '../../services/api';
import { FiMessageCircle, FiHeart, FiTrash2, FiMoreVertical, FiSend, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { DefaultAvatar } from '../layout/AFEXLogo';

const CommentSection = ({ postId, commentCount, onCommentCountChange }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await commentsAPI.getPostComments(postId);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
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
    <div className="border-t border-gray-200 dark:border-gray-800">
      {/* Comment Toggle */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
      >
        <FiMessageCircle className="w-5 h-5" />
        <span className="font-medium">
          {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
        </span>
      </button>

      {showComments && (
        <>
          {/* Comment Form */}
          <div className="p-4">
            <form onSubmit={handleSubmitComment} className="flex items-start space-x-3">
              {user?.avatar ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover border border-white dark:border-gray-800 shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <DefaultAvatar 
                    user={user} 
                    size="xs" 
                    className="hidden"
                  />
                </div>
              ) : (
                <DefaultAvatar 
                  user={user} 
                  size="xs"
                />
              )}
              
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  rows="2"
                  disabled={submitting}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiSend className="w-4 h-4" />
                    <span>Post</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Comments List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {comments.map((comment) => (
                  <div key={comment._id} className="p-4">
                    <div className="flex items-start space-x-3">
                      {comment.author.avatar ? (
                        <div className="relative flex-shrink-0">
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.username}
                            className="w-8 h-8 rounded-full object-cover border border-white dark:border-gray-800 shadow-sm"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <DefaultAvatar 
                            user={comment.author} 
                            size="xs" 
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <DefaultAvatar 
                          user={comment.author} 
                          size="xs"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        {editingComment === comment._id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                              rows="2"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditComment(comment._id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingComment(null);
                                  setEditText('');
                                }}
                                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {comment.author.firstName} {comment.author.lastName}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                  @{comment.author.username}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTimeAgo(comment.createdAt)}
                                </span>
                                {comment.isEdited && (
                                  <span className="text-xs text-gray-400">• Edited</span>
                                )}
                                {user && (user._id === comment.author._id || user.role === 'admin') && (
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => {
                                        setEditingComment(comment._id);
                                        setEditText(comment.content);
                                      }}
                                      className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                      <FiEdit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(comment._id)}
                                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                    >
                                      <FiTrash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-900 dark:text-white text-sm mt-1 leading-relaxed">
                              {comment.content}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CommentSection; 