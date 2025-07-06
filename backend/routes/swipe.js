const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Vote = require('../models/Vote');
const Badge = require('../models/Badge');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middlewares/auth');

// @route   GET /api/swipe/post
// @desc    Get a random post for swipe game
// @access  Public (temporarily for testing)
router.get('/post', optionalAuth, async (req, res) => {
  try {
    // Get posts that the user hasn't voted on yet
    const user = await User.findById(req.user._id);
    
    // For now, get a random public post
    // In a full implementation, you'd track which posts the user has already voted on
    const post = await Post.aggregate([
      { $match: { isPrivate: false } },
      { $sample: { size: 1 } }
    ]);

    if (post.length === 0) {
      return res.status(404).json({ message: 'No posts available for swipe' });
    }

    // Populate the post with author info
    const populatedPost = await Post.findById(post[0]._id)
      .populate('author', 'username firstName lastName avatar')
      .populate('likes', 'username firstName lastName avatar');

    res.json({ post: populatedPost });
  } catch (error) {
    console.error('Get swipe post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/swipe/vote/:postId
// @desc    Vote on a swipe post
// @access  Private
router.post('/vote/:postId', auth, async (req, res) => {
  try {
    const { vote } = req.body; // 'hot' or 'not'
    const { postId } = req.params;

    if (!['hot', 'not'].includes(vote)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Award XP for voting
    const user = await User.findById(req.user._id);
    user.xp += 5; // Award 5 XP for voting
    await user.save();

    // In a full implementation, you'd track the vote in a separate collection
    // For now, we'll just return success
    res.json({ 
      message: 'Vote recorded successfully',
      xpGained: 5
    });
  } catch (error) {
    console.error('Swipe vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard (top scorers)
router.get('/leaderboard', async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    
    let dateFilter = {};
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }
    
    // Get top posts by score
    const topPosts = await Post.find({
      ...dateFilter,
      score: { $gt: 0 }
    })
    .populate('author', 'username firstName lastName avatar')
    .sort({ score: -1, createdAt: -1 })
    .limit(10);
    
    // Transform posts to match frontend expectations
    const transformedTopPosts = topPosts.map(post => ({
      ...post.toObject(),
      userId: post.author,
      mediaUrl: post.media[0]?.url
    }));
    
    // Get top voters (users who voted the most)
    const topVoters = await Vote.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$voterId',
          voteCount: { $sum: 1 },
          hotVotes: {
            $sum: { $cond: [{ $eq: ['$voteType', 'hot'] }, 1, 0] }
          }
        }
      },
      { $sort: { voteCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$user._id',
          username: '$user.username',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          avatar: '$user.avatar',
          voteCount: 1,
          hotVotes: 1
        }
      }
    ]);
    
    res.json({
      topPosts: transformedTopPosts,
      topVoters
    });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

// Get user's voting stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const stats = await Vote.aggregate([
      { $match: { voterId: userId } },
      {
        $group: {
          _id: null,
          totalVotes: { $sum: 1 },
          hotVotes: { $sum: { $cond: [{ $eq: ['$voteType', 'hot'] }, 1, 0] } },
          notVotes: { $sum: { $cond: [{ $eq: ['$voteType', 'not'] }, 1, 0] } }
        }
      }
    ]);
    
    const userStats = stats[0] || {
      totalVotes: 0,
      hotVotes: 0,
      notVotes: 0
    };
    
    res.json(userStats);
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Helper function to check and award badges
async function checkBadgeUnlocks(voterId, postId) {
  try {
    // Get post creator
    const post = await Post.findById(postId);
    if (!post) return;
    
    const postCreatorId = post.author;
    
    // Check Hot Shot badge (50 🔥 votes received)
    const hotVotesReceived = await Vote.countDocuments({
      postId: { $in: await Post.find({ author: postCreatorId }).distinct('_id') },
      voteType: 'hot'
    });
    
    if (hotVotesReceived >= 50) {
      await Badge.findOneAndUpdate(
        { userId: postCreatorId, badgeName: 'Hot Shot' },
        {
          userId: postCreatorId,
          badgeName: 'Hot Shot',
          description: 'Received 50+ 🔥 votes on posts',
          icon: '🔥'
        },
        { upsert: true }
      );
    }
    
    // Check Swipe Master badge (100 votes given)
    const totalVotesGiven = await Vote.countDocuments({ voterId });
    if (totalVotesGiven >= 100) {
      await Badge.findOneAndUpdate(
        { userId: voterId, badgeName: 'Swipe Master' },
        {
          userId: voterId,
          badgeName: 'Swipe Master',
          description: 'Voted on 100+ posts',
          icon: '👆'
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error('Error checking badge unlocks:', err);
  }
}

module.exports = router; 