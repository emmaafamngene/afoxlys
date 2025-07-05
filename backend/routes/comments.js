const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Clip = require('../models/Clip');
const { auth, optionalAuth } = require('../middlewares/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

// @route   GET /api/comments/post/:postId
// @desc    Get comments for a post
// @access  Public
router.get('/post/:postId', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ 
      post: req.params.postId,
      parentComment: null // Only top-level comments
    })
      .populate('author', 'username firstName lastName avatar')
      .populate('likes', 'username firstName lastName avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username firstName lastName avatar'
        }
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Comment.countDocuments({ 
      post: req.params.postId,
      parentComment: null
    });

    res.json({
      comments,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get post comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/comments/clip/:clipId
// @desc    Get comments for a clip
// @access  Public
router.get('/clip/:clipId', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ 
      clip: req.params.clipId,
      parentComment: null // Only top-level comments
    })
      .populate('author', 'username firstName lastName avatar')
      .populate('likes', 'username firstName lastName avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username firstName lastName avatar'
        }
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Comment.countDocuments({ 
      clip: req.params.clipId,
      parentComment: null
    });

    res.json({
      comments,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get clip comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/comments/post/:postId
// @desc    Add comment to a post
// @access  Private
router.post(
  '/post/:postId',
  auth,
  [
    body('content')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be between 1 and 1000 characters'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const post = await Post.findById(req.params.postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const { content, parentCommentId } = req.body;

      const comment = new Comment({
        author: req.user._id,
        content,
        post: req.params.postId,
        parentComment: parentCommentId || null,
      });

      await comment.save();

      // If this is a reply, add it to the parent comment's replies
      if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
          $push: { replies: comment._id }
        });
      }

      // Add comment to post
      await Post.findByIdAndUpdate(req.params.postId, {
        $push: { comments: comment._id }
      });

      // Create notification for post owner (if not commenting on own post)
      if (post.author.toString() !== req.user._id.toString()) {
        try {
          const postContent = post.content.substring(0, 30) + (post.content.length > 30 ? '...' : '');
          const commentContent = content.substring(0, 30) + (content.length > 30 ? '...' : '');
          await createNotification(
            post.author,
            req.user._id,
            'comment',
            'New Comment',
            `${req.user.firstName || req.user.username} commented "${commentContent}" on your post: "${postContent}"`,
            post._id,
            'Post',
            { contentId: post._id, contentType: 'Post' }
          );
        } catch (error) {
          console.error('Error creating comment notification:', error);
        }
      }

      // Populate author info for response
      await comment.populate('author', 'username firstName lastName avatar');

      res.status(201).json({
        message: 'Comment added successfully',
        comment,
      });
    } catch (error) {
      console.error('Add post comment error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/comments/clip/:clipId
// @desc    Add comment to a clip
// @access  Private
router.post(
  '/clip/:clipId',
  auth,
  [
    body('content')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be between 1 and 1000 characters'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const clip = await Clip.findById(req.params.clipId);
      if (!clip) {
        return res.status(404).json({ message: 'Clip not found' });
      }

      const { content, parentCommentId } = req.body;

      const comment = new Comment({
        author: req.user._id,
        content,
        clip: req.params.clipId,
        parentComment: parentCommentId || null,
      });

      await comment.save();

      // If this is a reply, add it to the parent comment's replies
      if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
          $push: { replies: comment._id }
        });
      }

      // Add comment to clip
      await Clip.findByIdAndUpdate(req.params.clipId, {
        $push: { comments: comment._id }
      });

      // Create notification for clip owner (if not commenting on own clip)
      if (clip.author.toString() !== req.user._id.toString()) {
        try {
          const clipTitle = clip.title.substring(0, 30) + (clip.title.length > 30 ? '...' : '');
          const commentContent = content.substring(0, 30) + (content.length > 30 ? '...' : '');
          await createNotification(
            clip.author,
            req.user._id,
            'comment',
            'New Comment',
            `${req.user.firstName || req.user.username} commented "${commentContent}" on your clip: "${clipTitle}"`,
            clip._id,
            'Clip',
            { contentId: clip._id, contentType: 'Clip' }
          );
        } catch (error) {
          console.error('Error creating comment notification:', error);
        }
      }

      // Populate author info for response
      await comment.populate('author', 'username firstName lastName avatar');

      res.status(201).json({
        message: 'Comment added successfully',
        comment,
      });
    } catch (error) {
      console.error('Add clip comment error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private
router.put(
  '/:id',
  auth,
  [
    body('content')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be between 1 and 1000 characters'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const comment = await Comment.findById(req.params.id);
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      // Check if user owns the comment
      if (comment.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this comment' });
      }

      const { content } = req.body;

      const updatedComment = await Comment.findByIdAndUpdate(
        req.params.id,
        { content, isEdited: true },
        { new: true, runValidators: true }
      ).populate('author', 'username firstName lastName avatar');

      res.json({
        message: 'Comment updated successfully',
        comment: updatedComment,
      });
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove comment from post/clip
    if (comment.post) {
      await Post.findByIdAndUpdate(comment.post, {
        $pull: { comments: comment._id }
      });
    } else if (comment.clip) {
      await Clip.findByIdAndUpdate(comment.clip, {
        $pull: { comments: comment._id }
      });
    }

    // Remove from parent comment's replies if it's a reply
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: comment._id }
      });
    }

    // Delete the comment and all its replies
    await Comment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 