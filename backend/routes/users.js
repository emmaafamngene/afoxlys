const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const Clip = require('../models/Clip');
const { auth, optionalAuth } = require('../middlewares/auth');
const { uploadAvatar, uploadCoverPhoto, handleUploadError } = require('../middlewares/upload');
const Badge = require('../models/Badge');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (with pagination)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users by username or name
// @access  Public
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const searchQuery = {
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } }
      ]
    };

    // Exclude current user from search results
    if (req.user) {
      searchQuery._id = { $ne: req.user._id };
    }

    const users = await User.find(searchQuery)
      .select('username firstName lastName avatar')
      .lean()
      .limit(10)
      .sort({ username: 1 });

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username firstName lastName avatar')
      .populate('following', 'username firstName lastName avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (req.user) {
      isFollowing = user.followers.some(follower => follower._id.toString() === req.user._id.toString());
    }

    res.json({
      user: user.getPublicProfile(),
      isFollowing,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put(
  '/:id',
  auth,
  [
    body('firstName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if user is updating their own profile
      if (req.params.id !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }

      const { firstName, lastName, bio, isPrivate } = req.body;
      const updateFields = {};

      if (firstName !== undefined) updateFields.firstName = firstName;
      if (lastName !== undefined) updateFields.lastName = lastName;
      if (bio !== undefined) updateFields.bio = bio;
      if (isPrivate !== undefined) updateFields.isPrivate = isPrivate;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        message: 'Profile updated successfully',
        user: user.getPublicProfile(),
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/users/:id/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/:id/avatar', auth, uploadAvatar, handleUploadError, async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/cover
// @desc    Upload user cover photo
// @access  Private
router.post('/:id/cover', auth, uploadCoverPhoto, handleUploadError, async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const coverUrl = `/uploads/covers/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { coverPhoto: coverUrl },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Cover photo uploaded successfully',
      coverPhoto: coverUrl,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Upload cover error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/posts
// @desc    Get user posts
// @access  Public
router.get('/:id/posts', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: req.params.id })
      .populate('author', 'username firstName lastName avatar')
      .populate('likes', 'username firstName lastName avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Post.countDocuments({ author: req.params.id });

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
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/clips
// @desc    Get user clips
// @access  Public
router.get('/:id/clips', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const clips = await Clip.find({ author: req.params.id })
      .populate('author', 'username firstName lastName avatar')
      .populate('likes', 'username firstName lastName avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Clip.countDocuments({ author: req.params.id });

    res.json({
      clips,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get user clips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/following
// @desc    Get user's following list
// @access  Public
router.get('/:id/following', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username firstName lastName fullName avatar')
      .select('following');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.following);
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user badges
router.get('/:userId/badges', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const badges = await Badge.find({ userId })
      .sort({ earnedAt: -1 });
    
    res.json({ badges });
  } catch (err) {
    console.error('Error fetching user badges:', err);
    res.status(500).json({ message: 'Error fetching badges' });
  }
});

module.exports = router; 