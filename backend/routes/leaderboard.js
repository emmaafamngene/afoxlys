const express = require('express');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');

const router = express.Router();

// @route   GET /api/leaderboard
// @desc    Get top users by XP/level
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type = 'xp', limit = 10, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortField = type === 'level' ? 'level' : 'xp';
    
    const topUsers = await User.find()
      .select('username firstName lastName avatar xp level loginStreak')
      .sort({ [sortField]: -1, level: -1, xp: -1 }) // Secondary sort by level, then XP
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add rank to each user
    const usersWithRank = topUsers.map((user, index) => ({
      ...user,
      rank: skip + index + 1,
      displayName: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username
    }));

    // Get total count for pagination
    const totalUsers = await User.countDocuments();

    res.json({
      users: usersWithRank,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / parseInt(limit))
      },
      sortBy: type
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/global
// @desc    Get global leaderboard with more details
// @access  Public
router.get('/global', async (req, res) => {
  try {
    const topUsers = await User.find()
      .select('username firstName lastName avatar xp level loginStreak followers following')
      .sort({ xp: -1, level: -1 })
      .limit(50)
      .lean();

    const usersWithStats = topUsers.map((user, index) => ({
      ...user,
      rank: index + 1,
      displayName: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username,
      followerCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0
    }));

    res.json({
      users: usersWithStats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Global leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/weekly
// @desc    Get weekly top performers (placeholder for future implementation)
// @access  Public
router.get('/weekly', async (req, res) => {
  try {
    // This is a placeholder for weekly leaderboards
    // In the future, you could track weekly XP gains separately
    res.json({
      message: 'Weekly leaderboard coming soon!',
      users: []
    });
  } catch (error) {
    console.error('Weekly leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/user/:userId
// @desc    Get user's rank and nearby users
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's XP and level
    const user = await User.findById(userId)
      .select('username firstName lastName avatar xp level')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's rank
    const userRank = await User.countDocuments({
      $or: [
        { xp: { $gt: user.xp } },
        { xp: user.xp, level: { $gt: user.level } },
        { xp: user.xp, level: user.level, _id: { $lt: user._id } }
      ]
    }) + 1;

    // Get users around this user's rank (5 above, 5 below)
    const nearbyUsers = await User.find({
      $or: [
        { xp: { $gt: user.xp } },
        { xp: user.xp, level: { $gt: user.level } },
        { xp: user.xp, level: user.level, _id: { $ne: user._id } }
      ]
    })
      .select('username firstName lastName avatar xp level')
      .sort({ xp: -1, level: -1 })
      .limit(10)
      .lean();

    const usersWithRank = nearbyUsers.map((nearbyUser, index) => ({
      ...nearbyUser,
      rank: userRank - 5 + index,
      displayName: nearbyUser.firstName && nearbyUser.lastName 
        ? `${nearbyUser.firstName} ${nearbyUser.lastName}` 
        : nearbyUser.username
    }));

    res.json({
      user: {
        ...user,
        rank: userRank,
        displayName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username
      },
      nearbyUsers: usersWithRank
    });

  } catch (error) {
    console.error('User rank error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 