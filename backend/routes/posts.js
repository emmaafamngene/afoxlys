const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middlewares/auth');
const { uploadPostMedia, handleUploadError } = require('../middlewares/upload');
const { xpAwarder } = require('../middlewares/xpAwarder');

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts (feed)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { isPrivate: false };
    
    // If user is authenticated, show posts from followed users and public posts
    if (req.user) {
      const user = await User.findById(req.user._id).populate('following');
      const followingIds = user.following.map(followed => followed._id);
      followingIds.push(req.user._id); // Include user's own posts
      
      query = {
        $or: [
          { author: { $in: followingIds } },
          { isPrivate: false }
        ]
      };
    }

    const posts = await Post.find(query)
      .populate('author', 'username firstName lastName avatar')
      .populate('likes', 'username firstName lastName avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post(
  '/',
  auth,
  uploadPostMedia,
  handleUploadError,
  xpAwarder(10, 'creating a post'),
  [
    body('content')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Content must be between 1 and 2000 characters'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content, tags, location, isPrivate } = req.body;
      
      // Process uploaded media files
      const media = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          const mediaItem = {
            type: file.mimetype.startsWith('image/') ? 'image' : 'video',
            url: `/uploads/posts/${file.filename}`,
          };
          
          // Add thumbnail for videos (you might want to generate this)
          if (mediaItem.type === 'video') {
            mediaItem.thumbnail = `/uploads/posts/thumbnails/${file.filename.replace(/\.[^/.]+$/, '.jpg')}`;
          }
          
          media.push(mediaItem);
        });
      }

      const post = new Post({
        author: req.user._id,
        content,
        media,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        location,
        isPrivate: isPrivate === 'true',
      });

      await post.save();

      // Populate author info for response
      await post.populate('author', 'username firstName lastName avatar');

      res.status(201).json({
        message: 'Post created successfully',
        post,
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);



// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put(
  '/:id',
  auth,
  [
    body('content')
      .optional()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Content must be between 1 and 2000 characters'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if user owns the post
      if (post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this post' });
      }

      const { content, tags, location, isPrivate } = req.body;
      const updateFields = { isEdited: true };

      if (content !== undefined) updateFields.content = content;
      if (tags !== undefined) updateFields.tags = tags.split(',').map(tag => tag.trim());
      if (location !== undefined) updateFields.location = location;
      if (isPrivate !== undefined) updateFields.isPrivate = isPrivate;

      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true, runValidators: true }
      )
        .populate('author', 'username firstName lastName avatar')
        .populate('likes', 'username firstName lastName avatar');

      res.json({
        message: 'Post updated successfully',
        post: updatedPost,
      });
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/feed
// @desc    Get user's personalized feed
// @access  Public (temporarily for testing)
router.get('/feed', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { isPrivate: false };
    
    // If user is authenticated, show posts from followed users and public posts
    if (req.user) {
      const user = await User.findById(req.user._id).populate('following');
      const followingIds = user.following.map(followed => followed._id);
      followingIds.push(req.user._id); // Include user's own posts
      
      query = {
        $or: [
          { author: { $in: followingIds } },
          { isPrivate: false }
        ]
      };
    }

    const posts = await Post.find(query)
      .populate('author', 'username firstName lastName avatar')
      .populate('likes', 'username firstName lastName avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get a specific post
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username firstName lastName avatar')
      .populate('likes', 'username firstName lastName avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user can view private post
    if (post.isPrivate && (!req.user || post.author._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router; 