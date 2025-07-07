const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const auth = authMiddleware.auth;
const Short = require('../models/Short');
const User = require('../models/User');

// Get all shorts (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const shorts = await Short.find()
      .populate('author', 'username firstName lastName avatar')
      .populate('comments.author', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Add isLiked field for authenticated users
    if (req.user) {
      shorts.forEach(short => {
        short.isLiked = short.likes.includes(req.user._id);
      });
    }

    const total = await Short.countDocuments();
    const hasMore = skip + limit < total;

    res.json({
      shorts,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching shorts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new short
router.post('/', auth, async (req, res) => {
  try {
    const { caption, mediaUrl, type } = req.body;

    if (!caption || !mediaUrl || !type) {
      return res.status(400).json({ message: 'Caption, mediaUrl, and type are required' });
    }

    if (!['video', 'image'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either video or image' });
    }

    const short = new Short({
      author: req.user._id,
      caption,
      mediaUrl,
      type
    });

    await short.save();

    // Populate author info
    await short.populate('author', 'username firstName lastName avatar');

    res.status(201).json(short);
  } catch (error) {
    console.error('Error creating short:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific short by ID
router.get('/:id', async (req, res) => {
  try {
    const short = await Short.findById(req.params.id)
      .populate('author', 'username firstName lastName avatar')
      .populate('comments.author', 'username firstName lastName avatar');

    if (!short) {
      return res.status(404).json({ message: 'Short not found' });
    }

    // Increment views
    short.views += 1;
    await short.save();

    // Add isLiked field for authenticated users
    if (req.user) {
      short.isLiked = short.likes.includes(req.user._id);
    }

    res.json(short);
  } catch (error) {
    console.error('Error fetching short:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/unlike a short
router.post('/:id/like', auth, async (req, res) => {
  try {
    const short = await Short.findById(req.params.id);

    if (!short) {
      return res.status(404).json({ message: 'Short not found' });
    }

    const likeIndex = short.likes.indexOf(req.user._id);

    if (likeIndex > -1) {
      // Unlike
      short.likes.splice(likeIndex, 1);
    } else {
      // Like
      short.likes.push(req.user._id);
    }

    await short.save();

    res.json({
      isLiked: likeIndex === -1,
      likes: short.likes.length
    });
  } catch (error) {
    console.error('Error liking/unliking short:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a comment to a short
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const short = await Short.findById(req.params.id);

    if (!short) {
      return res.status(404).json({ message: 'Short not found' });
    }

    const comment = {
      author: req.user._id,
      content: content.trim()
    };

    short.comments.push(comment);
    await short.save();

    // Populate the new comment's author info
    await short.populate('comments.author', 'username firstName lastName avatar');

    const newComment = short.comments[short.comments.length - 1];

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a short
router.get('/:id/comments', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const short = await Short.findById(req.params.id)
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username firstName lastName avatar'
        },
        options: {
          sort: { createdAt: -1 },
          skip,
          limit
        }
      });

    if (!short) {
      return res.status(404).json({ message: 'Short not found' });
    }

    const total = short.comments.length;
    const hasMore = skip + limit < total;

    res.json({
      comments: short.comments,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a short (only by author)
router.delete('/:id', auth, async (req, res) => {
  try {
    const short = await Short.findById(req.params.id);

    if (!short) {
      return res.status(404).json({ message: 'Short not found' });
    }

    if (short.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this short' });
    }

    await short.remove();

    res.json({ message: 'Short deleted successfully' });
  } catch (error) {
    console.error('Error deleting short:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get shorts by user
router.get('/user/:userId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const shorts = await Short.find({ author: req.params.userId })
      .populate('author', 'username firstName lastName avatar')
      .populate('comments.author', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Add isLiked field for authenticated users
    if (req.user) {
      shorts.forEach(short => {
        short.isLiked = short.likes.includes(req.user._id);
      });
    }

    const total = await Short.countDocuments({ author: req.params.userId });
    const hasMore = skip + limit < total;

    res.json({
      shorts,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching user shorts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 