const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Vote = require('../models/Vote');
const Badge = require('../models/Badge');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');

// Get a random post that user hasn't voted on
router.get('/post', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get posts the user has already voted on
    const votedPosts = await Vote.find({ voterId: userId }).distinct('postId');
    
    // Find a random public post that user hasn't voted on
    const randomPost = await Post.findOne({
      _id: { $nin: votedPosts },
      isPrivate: false
    })
    .populate('author', 'username firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(1);
    
    if (!randomPost) {
      return res.status(404).json({ 
        message: 'No more posts to swipe on!',
        type: 'no_more_posts'
      });
    }
    
    // Transform the post to match expected format for frontend
    const transformedPost = {
      ...randomPost.toObject(),
      userId: randomPost.author, // Map author to userId for frontend compatibility
      mediaUrl: randomPost.media[0]?.url, // Use first media item's URL
      score: randomPost.score || 0
    };
    
    res.json(transformedPost);
  } catch (err) {
    console.error('Error fetching random post:', err);
    res.status(500).json({ message: 'Error fetching post' });
  }
});

// Vote on a post (🔥 or 👎)
router.post('/vote', auth, async (req, res) => {
  try {
    const { postId, voteType } = req.body;
    const voterId = req.user._id;
    
    if (!['hot', 'not'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }
    
    // Check if user already voted on this post
    const existingVote = await Vote.findOne({ voterId, postId });
    if (existingVote) {
      return res.status(400).json({ message: 'Already voted on this post' });
    }
    
    // Create the vote
    const vote = await Vote.create({
      voterId,
      postId,
      voteType
    });
    
    // Update post score if it's a hot vote
    if (voteType === 'hot') {
      await Post.findByIdAndUpdate(postId, {
        $inc: { score: 1 }
      });
    }
    
    // Check for badge unlocks
    await checkBadgeUnlocks(voterId, postId);
    
    console.log(`✅ Vote ${voteType} recorded for post:`, postId);
    
    res.json({ 
      message: 'Vote recorded successfully',
      voteType,
      postId
    });
  } catch (err) {
    console.error('Error recording vote:', err);
    res.status(500).json({ message: 'Error recording vote' });
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