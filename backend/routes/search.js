const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Clip = require('../models/Clip');
const { optionalAuth } = require('../middlewares/auth');

const router = express.Router();

// @route   GET /api/search/users
// @desc    Search users
// @access  Public
router.get('/users', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchQuery = q.trim();

    // Create search conditions
    const searchConditions = {
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { bio: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    // If user is authenticated, exclude private users they don't follow
    if (req.user) {
      const currentUser = await User.findById(req.user._id).populate('following');
      const followingIds = currentUser.following.map(followed => followed._id);
      followingIds.push(req.user._id);

      searchConditions.$and = [
        {
          $or: [
            { isPrivate: false },
            { _id: { $in: followingIds } }
          ]
        }
      ];
    } else {
      // For non-authenticated users, only show public users
      searchConditions.isPrivate = false;
    }

    const users = await User.find(searchConditions)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(searchConditions);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1,
      },
      query: searchQuery,
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/search/posts
// @desc    Search posts
// @access  Public
router.get('/posts', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchQuery = q.trim();

    // Create search conditions
    const searchConditions = {
      $or: [
        { content: { $regex: searchQuery, $options: 'i' } },
        { tags: { $in: [new RegExp(searchQuery, 'i')] } }
      ]
    };

    // If user is authenticated, show posts from followed users and public posts
    if (req.user) {
      const currentUser = await User.findById(req.user._id).populate('following');
      const followingIds = currentUser.following.map(followed => followed._id);
      followingIds.push(req.user._id);

      searchConditions.$and = [
        {
          $or: [
            { author: { $in: followingIds } },
            { isPrivate: false }
          ]
        }
      ];
    } else {
      // For non-authenticated users, only show public posts
      searchConditions.isPrivate = false;
    }

    const posts = await Post.find(searchConditions)
      .populate('author', 'username firstName lastName avatar')
      .populate('likes', 'username firstName lastName avatar')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Post.countDocuments(searchConditions);

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1,
      },
      query: searchQuery,
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/search/clips
// @desc    Search clips
// @access  Public
router.get('/clips', optionalAuth, async (req, res) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchQuery = q.trim();

    // Create search conditions
    const searchConditions = {
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { tags: { $in: [new RegExp(searchQuery, 'i')] } }
      ]
    };

    // Add category filter if provided
    if (category && category !== 'all') {
      searchConditions.category = category;
    }

    // If user is authenticated, show clips from followed users and public clips
    if (req.user) {
      const currentUser = await User.findById(req.user._id).populate('following');
      const followingIds = currentUser.following.map(followed => followed._id);
      followingIds.push(req.user._id);

      searchConditions.$and = [
        {
          $or: [
            { author: { $in: followingIds } },
            { isPublic: true }
          ]
        }
      ];
    } else {
      // For non-authenticated users, only show public clips
      searchConditions.isPublic = true;
    }

    const clips = await Clip.find(searchConditions)
      .populate('author', 'username firstName lastName avatar')
      .populate('likes', 'username firstName lastName avatar')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Clip.countDocuments(searchConditions);

    res.json({
      clips,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1,
      },
      query: searchQuery,
      category: category || 'all',
    });
  } catch (error) {
    console.error('Search clips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/search/global
// @desc    Global search across users, posts, and clips
// @access  Public
router.get('/global', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchQuery = q.trim();

    // Search users
    const userConditions = {
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    if (req.user) {
      const currentUser = await User.findById(req.user._id).populate('following');
      const followingIds = currentUser.following.map(followed => followed._id);
      followingIds.push(req.user._id);

      userConditions.$and = [
        {
          $or: [
            { isPrivate: false },
            { _id: { $in: followingIds } }
          ]
        }
      ];
    } else {
      userConditions.isPrivate = false;
    }

    const users = await User.find(userConditions)
      .select('-password')
      .limit(3)
      .sort({ createdAt: -1 });

    // Search posts
    const postConditions = {
      $or: [
        { content: { $regex: searchQuery, $options: 'i' } },
        { tags: { $in: [new RegExp(searchQuery, 'i')] } }
      ]
    };

    if (req.user) {
      const currentUser = await User.findById(req.user._id).populate('following');
      const followingIds = currentUser.following.map(followed => followed._id);
      followingIds.push(req.user._id);

      postConditions.$and = [
        {
          $or: [
            { author: { $in: followingIds } },
            { isPrivate: false }
          ]
        }
      ];
    } else {
      postConditions.isPrivate = false;
    }

    const posts = await Post.find(postConditions)
      .populate('author', 'username firstName lastName avatar')
      .limit(3)
      .sort({ createdAt: -1 });

    // Search clips
    const clipConditions = {
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { tags: { $in: [new RegExp(searchQuery, 'i')] } }
      ]
    };

    if (req.user) {
      const currentUser = await User.findById(req.user._id).populate('following');
      const followingIds = currentUser.following.map(followed => followed._id);
      followingIds.push(req.user._id);

      clipConditions.$and = [
        {
          $or: [
            { author: { $in: followingIds } },
            { isPublic: true }
          ]
        }
      ];
    } else {
      clipConditions.isPublic = true;
    }

    const clips = await Clip.find(clipConditions)
      .populate('author', 'username firstName lastName avatar')
      .limit(3)
      .sort({ createdAt: -1 });

    res.json({
      users,
      posts,
      clips,
      query: searchQuery,
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 