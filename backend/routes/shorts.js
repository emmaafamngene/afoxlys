const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const auth = authMiddleware.auth;
const Short = require('../models/Short');
const User = require('../models/User');
const uploadMiddleware = require('../middlewares/upload');
const { uploadClipVideo, validateVideoCodec, handleUploadError } = uploadMiddleware;

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
      .limit(limit)
      .lean();

    // Add isLiked field for authenticated users
    if (req.user) {
      shorts.forEach(short => {
        short.isLiked = short.likes.includes(req.user._id);
      });
    }

    const total = await Short.countDocuments();
    const hasMore = skip + limit < total;

    console.log(`Fetched ${shorts.length} shorts, page ${page}`);
    res.json({
      success: true,
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
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch shorts',
      error: error.message 
    });
  }
});

// Create a new short
router.post('/', auth, async (req, res) => {
  try {
    const { caption, mediaUrl, type } = req.body;

    // Validation
    if (!caption || !caption.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Caption is required' 
      });
    }

    if (!mediaUrl) {
      return res.status(400).json({ 
        success: false,
        message: 'Media URL is required' 
      });
    }

    if (!type || !['video', 'image'].includes(type)) {
      return res.status(400).json({ 
        success: false,
        message: 'Type must be either video or image' 
      });
    }

    // API-level validation for supported video formats
    if (type === 'video') {
      // Only allow .mp4 videos (H.264 + AAC enforced at upload)
      if (!mediaUrl.toLowerCase().endsWith('.mp4')) {
        return res.status(400).json({
          success: false,
          message: 'Only MP4 videos are supported. Please upload a video encoded with H.264 video and AAC audio.'
        });
      }
    }

    // Reject blob URLs or URLs not from /uploads
    if (mediaUrl.startsWith('blob:') || !mediaUrl.startsWith('/uploads/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid media URL. Please upload your file through the official upload endpoint.'
      });
    }

    // Create the short
    const short = new Short({
      author: req.user._id,
      caption: caption.trim(),
      mediaUrl,
      type
    });

    await short.save();

    // Populate author info
    await short.populate('author', 'username firstName lastName avatar');

    console.log(`Short created by ${req.user.username}: ${short._id}`);
    res.status(201).json({
      success: true,
      short
    });
  } catch (error) {
    console.error('Error creating short:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create short',
      error: error.message 
    });
  }
});

// Upload endpoint for shorts media (video/image)
router.post('/upload', auth, uploadClipVideo, handleUploadError, validateVideoCodec, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }
  // Return the file URL (adjust as needed for your static file serving setup)
  const fileUrl = `/uploads/clips/${req.file.filename}`;
  res.status(201).json({ success: true, url: fileUrl });
});

// Get a specific short by ID
router.get('/:id', async (req, res) => {
  try {
    const short = await Short.findById(req.params.id)
      .populate('author', 'username firstName lastName avatar')
      .populate('comments.author', 'username firstName lastName avatar')
      .lean();

    if (!short) {
      return res.status(404).json({ 
        success: false,
        message: 'Short not found' 
      });
    }

    // Increment views
    await Short.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Add isLiked field for authenticated users
    if (req.user) {
      short.isLiked = short.likes.includes(req.user._id);
    }

    res.json({
      success: true,
      short
    });
  } catch (error) {
    console.error('Error fetching short:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch short',
      error: error.message 
    });
  }
});

// Like/unlike a short
router.post('/:id/like', auth, async (req, res) => {
  try {
    const short = await Short.findById(req.params.id);

    if (!short) {
      return res.status(404).json({ 
        success: false,
        message: 'Short not found' 
      });
    }

    const likeIndex = short.likes.indexOf(req.user._id);
    let isLiked = false;

    if (likeIndex > -1) {
      // Unlike
      short.likes.splice(likeIndex, 1);
    } else {
      // Like
      short.likes.push(req.user._id);
      isLiked = true;
    }

    await short.save();

    console.log(`Short ${isLiked ? 'liked' : 'unliked'} by ${req.user.username}`);
    res.json({
      success: true,
      isLiked,
      likes: short.likes.length
    });
  } catch (error) {
    console.error('Error liking/unliking short:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to like/unlike short',
      error: error.message 
    });
  }
});

// Add a comment to a short
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Comment content is required' 
      });
    }

    const short = await Short.findById(req.params.id);

    if (!short) {
      return res.status(404).json({ 
        success: false,
        message: 'Short not found' 
      });
    }

    const comment = {
      author: req.user._id,
      content: content.trim(),
      createdAt: new Date()
    };

    short.comments.push(comment);
    await short.save();

    // Populate the new comment's author info
    await short.populate('comments.author', 'username firstName lastName avatar');

    const newComment = short.comments[short.comments.length - 1];

    console.log(`Comment added to short ${req.params.id} by ${req.user.username}`);
    res.status(201).json({
      success: true,
      comment: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add comment',
      error: error.message 
    });
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
      })
      .lean();

    if (!short) {
      return res.status(404).json({ 
        success: false,
        message: 'Short not found' 
      });
    }

    const total = short.comments.length;
    const hasMore = skip + limit < total;

    res.json({
      success: true,
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
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch comments',
      error: error.message 
    });
  }
});

// Delete a short (only by author)
router.delete('/:id', auth, async (req, res) => {
  try {
    const short = await Short.findById(req.params.id);

    if (!short) {
      return res.status(404).json({ 
        success: false,
        message: 'Short not found' 
      });
    }

    if (short.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this short' 
      });
    }

    await Short.findByIdAndDelete(req.params.id);

    console.log(`Short ${req.params.id} deleted by ${req.user.username}`);
    res.json({ 
      success: true,
      message: 'Short deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting short:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete short',
      error: error.message 
    });
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
      .limit(limit)
      .lean();

    // Add isLiked field for authenticated users
    if (req.user) {
      shorts.forEach(short => {
        short.isLiked = short.likes.includes(req.user._id);
      });
    }

    const total = await Short.countDocuments({ author: req.params.userId });
    const hasMore = skip + limit < total;

    res.json({
      success: true,
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
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch user shorts',
      error: error.message 
    });
  }
});

module.exports = router; 