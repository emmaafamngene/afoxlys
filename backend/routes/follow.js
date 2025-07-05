const express = require('express');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

// @route   POST /api/follow/:userId
// @desc    Follow/unfollow a user
// @access  Private
router.post('/:userId', auth, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-following
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.includes(req.params.userId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: req.params.userId }
      });
      
      await User.findByIdAndUpdate(req.params.userId, {
        $pull: { followers: req.user._id }
      });

      res.json({ 
        message: 'User unfollowed', 
        following: false,
        followerCount: userToFollow.followers.length - 1
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(req.user._id, {
        $push: { following: req.params.userId }
      });
      
      await User.findByIdAndUpdate(req.params.userId, {
        $push: { followers: req.user._id }
      });

      // Create notification for the user being followed
      try {
        await createNotification(
          req.params.userId,
          req.user._id,
          'follow',
          'New Follower',
          `${req.user.firstName || req.user.username} started following you`,
          null,
          null,
          { followerId: req.user._id }
        );
      } catch (error) {
        console.error('Error creating follow notification:', error);
      }

      res.json({ 
        message: 'User followed', 
        following: true,
        followerCount: userToFollow.followers.length + 1
      });
    }
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/follow/:userId
// @desc    Check if current user is following a user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.includes(req.params.userId);
    
    res.json({ following: isFollowing });
  } catch (error) {
    console.error('Check follow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/follow/:userId/followers
// @desc    Get user's followers
// @access  Public
router.get('/:userId/followers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.userId)
      .populate({
        path: 'followers',
        select: 'username firstName lastName avatar bio',
        options: {
          skip: skip,
          limit: limit,
          sort: { createdAt: -1 }
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const total = user.followers.length;

    res.json({
      followers: user.followers,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/follow/:userId/following
// @desc    Get users that a user is following
// @access  Public
router.get('/:userId/following', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.userId)
      .populate({
        path: 'following',
        select: 'username firstName lastName avatar bio',
        options: {
          skip: skip,
          limit: limit,
          sort: { createdAt: -1 }
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const total = user.following.length;

    res.json({
      following: user.following,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 