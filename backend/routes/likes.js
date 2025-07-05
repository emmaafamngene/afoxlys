const express = require('express');
const Post = require('../models/Post');
const Clip = require('../models/Clip');
const Comment = require('../models/Comment');
const { auth } = require('../middlewares/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

// @route   POST /api/likes/post/:postId
// @desc    Like/unlike a post
// @access  Private
router.post('/post/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      await Post.findByIdAndUpdate(req.params.postId, {
        $pull: { likes: userId }
      });
      res.json({ message: 'Post unliked', liked: false });
    } else {
      // Like
      await Post.findByIdAndUpdate(req.params.postId, {
        $push: { likes: userId }
      });

      // Create notification for post owner (if not liking own post)
      if (post.author.toString() !== userId.toString()) {
        try {
          const postContent = post.content.substring(0, 30) + (post.content.length > 30 ? '...' : '');
          await createNotification(
            post.author,
            userId,
            'like',
            'New Like',
            `${req.user.firstName || req.user.username} liked your post: "${postContent}"`,
            post._id,
            'Post',
            { contentId: post._id, contentType: 'Post' }
          );
        } catch (error) {
          console.error('Error creating like notification:', error);
        }
      }

      res.json({ message: 'Post liked', liked: true });
    }
  } catch (error) {
    console.error('Toggle post like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/likes/clip/:clipId
// @desc    Like/unlike a clip
// @access  Private
router.post('/clip/:clipId', auth, async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.clipId);
    if (!clip) {
      return res.status(404).json({ message: 'Clip not found' });
    }

    const userId = req.user._id;
    const isLiked = clip.likes.includes(userId);

    if (isLiked) {
      // Unlike
      await Clip.findByIdAndUpdate(req.params.clipId, {
        $pull: { likes: userId }
      });
      res.json({ message: 'Clip unliked', liked: false });
    } else {
      // Like
      await Clip.findByIdAndUpdate(req.params.clipId, {
        $push: { likes: userId }
      });

      // Create notification for clip owner (if not liking own clip)
      if (clip.author.toString() !== userId.toString()) {
        try {
          const clipTitle = clip.title.substring(0, 30) + (clip.title.length > 30 ? '...' : '');
          await createNotification(
            clip.author,
            userId,
            'like',
            'New Like',
            `${req.user.firstName || req.user.username} liked your clip: "${clipTitle}"`,
            clip._id,
            'Clip',
            { contentId: clip._id, contentType: 'Clip' }
          );
        } catch (error) {
          console.error('Error creating like notification:', error);
        }
      }

      res.json({ message: 'Clip liked', liked: true });
    }
  } catch (error) {
    console.error('Toggle clip like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/likes/comment/:commentId
// @desc    Like/unlike a comment
// @access  Private
router.post('/comment/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const userId = req.user._id;
    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      // Unlike
      await Comment.findByIdAndUpdate(req.params.commentId, {
        $pull: { likes: userId }
      });
      res.json({ message: 'Comment unliked', liked: false });
    } else {
      // Like
      await Comment.findByIdAndUpdate(req.params.commentId, {
        $push: { likes: userId }
      });

      // Create notification for comment owner (if not liking own comment)
      if (comment.author.toString() !== userId.toString()) {
        try {
          const commentContent = comment.content.substring(0, 30) + (comment.content.length > 30 ? '...' : '');
          await createNotification(
            comment.author,
            userId,
            'like',
            'New Like',
            `${req.user.firstName || req.user.username} liked your comment: "${commentContent}"`,
            comment._id,
            'Comment',
            { contentId: comment._id, contentType: 'Comment' }
          );
        } catch (error) {
          console.error('Error creating like notification:', error);
        }
      }

      res.json({ message: 'Comment liked', liked: true });
    }
  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/likes/post/:postId
// @desc    Check if user liked a post
// @access  Private
router.get('/post/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);
    res.json({ liked: isLiked });
  } catch (error) {
    console.error('Check post like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/likes/clip/:clipId
// @desc    Check if user liked a clip
// @access  Private
router.get('/clip/:clipId', auth, async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.clipId);
    if (!clip) {
      return res.status(404).json({ message: 'Clip not found' });
    }

    const isLiked = clip.likes.includes(req.user._id);
    res.json({ liked: isLiked });
  } catch (error) {Jjjn
    console.error('Check clip like error:', error);
    res.status(500).json({ message: 'Server erIninin jror' });
  }
});

// @route   GET /api/likes/comment/:commentId
// @desc    Check if user liked a comment
// @access  Private
router.get('/comment/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isLiked = comment.likes.includes(req.user._id);
    res.json({ liked: isLiked });
  } catch (error) {
    console.error('Check comment like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 