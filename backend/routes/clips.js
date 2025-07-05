const express = require('express');
const { body, validationResult } = require('express-validator');
const Clip = require('../models/Clip');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middlewares/auth');
const { uploadClipVideo, handleUploadError } = require('../middlewares/upload');
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Post = require('../models/Post');
const { upload } = require('../middlewares/upload');
const { promisify } = require('util');

const router = express.Router();

// Helper function to get video duration using FFmpeg
const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpeg, [
      '-i', filePath,
      '-f', 'null',
      '-'
    ]);

    let stderr = '';
    ffmpegProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpegProcess.on('close', (code) => {
      const durationMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2]);
        const seconds = parseInt(durationMatch[3]);
        const centiseconds = parseInt(durationMatch[4]);
        
        const totalSeconds = hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
        resolve(totalSeconds);
      } else {
        reject(new Error('Could not determine video duration'));
      }
    });

    ffmpegProcess.on('error', reject);
  });
};

// Helper function to generate thumbnail
const generateThumbnail = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpeg, [
      '-i', inputPath,
      '-ss', '00:00:01',
      '-vframes', '1',
      '-vf', 'scale=360:640',
      '-y',
      outputPath
    ]);

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error('Failed to generate thumbnail'));
      }
    });

    ffmpegProcess.on('error', reject);
  });
};

// @route   GET /api/clips/categories
// @desc    Get clip categories
// @access  Public
router.get('/categories', (req, res) => {
  const categories = [
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'education', label: 'Education' },
    { value: 'comedy', label: 'Comedy' },
    { value: 'music', label: 'Music' },
    { value: 'dance', label: 'Dance' },
    { value: 'food', label: 'Food' },
    { value: 'travel', label: 'Travel' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'other', label: 'Other' },
  ];

  res.json({ categories });
});

// @route   GET /api/clips
// @desc    Get all clips (AFEXClips feed)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;

    let query = { isPublic: true };
    
    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = category;
    }

    // If user is authenticated, show clips from followed users and public clips
    if (req.user) {
      const user = await User.findById(req.user._id).populate('following');
      const followingIds = user.following.map(followed => followed._id);
      followingIds.push(req.user._id); // Include user's own clips
      
      query = {
        $or: [
          { author: { $in: followingIds } },
          { isPublic: true }
        ]
      };

      if (category && category !== 'all') {
        query.category = category;
      }
    }

    const clips = await Clip.find(query)
      .populate('author', 'username firstName lastName avatar')
      .populate('likes', 'username firstName lastName avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Clip.countDocuments(query);

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
    console.error('Get clips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/clips
// @desc    Create a new clip (AFEXClip)
// @access  Private
router.post(
  '/',
  auth,
  uploadClipVideo,
  handleUploadError,
  [
    body('title')
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('category')
      .optional()
      .isIn(['entertainment', 'education', 'comedy', 'music', 'dance', 'food', 'travel', 'fitness', 'fashion', 'other'])
      .withMessage('Invalid category'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No video file uploaded' });
      }

      const { title, description, category, tags, isPublic } = req.body;
      const videoPath = req.file.path;
      
      // Check video duration
      const duration = await getVideoDuration(videoPath);
      if (duration > 90) {
        // Delete uploaded file
        fs.unlinkSync(videoPath);
        return res.status(400).json({ message: 'Video must be 90 seconds or less' });
      }

      // Generate thumbnail
      const thumbnailDir = path.join(__dirname, '../uploads/clips/thumbnails');
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }
      
      const thumbnailFilename = `thumbnail-${Date.now()}.jpg`;
      const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
      
      try {
        await generateThumbnail(videoPath, thumbnailPath);
      } catch (error) {
        console.error('Thumbnail generation failed:', error);
        // Continue without thumbnail
      }

      const videoUrl = `/uploads/clips/${req.file.filename}`;
      const thumbnailUrl = `/uploads/clips/thumbnails/${thumbnailFilename}`;

      const clip = new Clip({
        author: req.user._id,
        title,
        description,
        videoUrl,
        thumbnailUrl,
        duration: Math.round(duration),
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        category: category || 'other',
        isPublic: isPublic !== 'false',
      });

      await clip.save();

      // Populate author info for response
      await clip.populate('author', 'username firstName lastName avatar');

      res.status(201).json({
        message: 'Clip created successfully',
        clip,
      });
    } catch (error) {
      console.error('Create clip error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/clips/:id
// @desc    Get a specific clip
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.id)
      .populate('author', 'username firstName lastName avatar')
      .populate('likes', 'username firstName lastName avatar');

    if (!clip) {
      return res.status(404).json({ message: 'Clip not found' });
    }

    // Check if user can view private clip
    if (!clip.isPublic && (!req.user || clip.author._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Increment view count
    clip.views += 1;
    await clip.save();

    res.json({ clip });
  } catch (error) {
    console.error('Get clip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/clips/:id
// @desc    Update a clip
// @access  Private
router.put(
  '/:id',
  auth,
  [
    body('title')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('category')
      .optional()
      .isIn(['entertainment', 'education', 'comedy', 'music', 'dance', 'food', 'travel', 'fitness', 'fashion', 'other'])
      .withMessage('Invalid category'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const clip = await Clip.findById(req.params.id);

      if (!clip) {
        return res.status(404).json({ message: 'Clip not found' });
      }

      // Check if user owns the clip
      if (clip.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this clip' });
      }

      const { title, description, category, tags, isPublic } = req.body;
      const updateFields = {};

      if (title !== undefined) updateFields.title = title;
      if (description !== undefined) updateFields.description = description;
      if (category !== undefined) updateFields.category = category;
      if (tags !== undefined) updateFields.tags = tags.split(',').map(tag => tag.trim());
      if (isPublic !== undefined) updateFields.isPublic = isPublic;

      const updatedClip = await Clip.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true, runValidators: true }
      )
        .populate('author', 'username firstName lastName avatar')
        .populate('likes', 'username firstName lastName avatar');

      res.json({
        message: 'Clip updated successfully',
        clip: updatedClip,
      });
    } catch (error) {
      console.error('Update clip error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/clips/:id
// @desc    Delete a clip
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.id);

    if (!clip) {
      return res.status(404).json({ message: 'Clip not found' });
    }

    // Check if user owns the clip
    if (clip.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this clip' });
    }

    // Delete video file
    const videoPath = path.join(__dirname, '..', clip.videoUrl);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    // Delete thumbnail file
    const thumbnailPath = path.join(__dirname, '..', clip.thumbnailUrl);
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }

    await Clip.findByIdAndDelete(req.params.id);

    res.json({ message: 'Clip deleted successfully' });
  } catch (error) {
    console.error('Delete clip error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/clips/from-post/:postId
// @desc    Create a clip from an existing post with video content
// @access  Private
router.post('/from-post/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, description, category, tags } = req.body;

    // Find the post
    const post = await Post.findById(postId).populate('author', 'username firstName lastName avatar');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if post has video content
    if (!post.media || !post.media.type || !post.media.type.startsWith('video/')) {
      return res.status(400).json({ message: 'Post does not contain video content' });
    }

    // Check if user owns the post or has permission
    if (post.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only create clips from your own posts' });
    }

    // Check if clip already exists for this post
    const existingClip = await Clip.findOne({ sourcePost: postId });
    if (existingClip) {
      return res.status(400).json({ message: 'A clip already exists for this post' });
    }

    // Create clip from post
    const clip = new Clip({
      title: title || post.content.substring(0, 100) + '...',
      description: description || post.content,
      category: category || 'general',
      tags: tags ? JSON.parse(tags) : (post.tags || []),
      duration: post.media.duration || null,
      videoUrl: post.media.url,
      thumbnailUrl: post.media.thumbnail || null,
      author: req.user._id,
      sourcePost: postId, // Reference to original post
      views: 0,
      likeCount: 0,
      commentCount: 0
    });

    await clip.save();

    // Populate author info
    await clip.populate('author', 'username firstName lastName avatar');

    res.status(201).json({
      message: 'Clip created from post successfully',
      clip
    });
  } catch (error) {
    console.error('Create clip from post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/clips
// @desc    Get all clips with pagination and filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const skip = (page - 1) * limit;

    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    const clips = await Clip.find(filter)
      .populate('author', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Clip.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      clips,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        totalClips: total
      }
    });
  } catch (error) {
    console.error('Get clips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 