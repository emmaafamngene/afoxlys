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
const Payment = require('../models/Payment');

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
// @desc    Get all clips (AFEXClips feed) - TEMPORARILY CLOSED
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    // Return fundraising information instead of clips
    res.json({
      status: 'closed',
      message: 'AFEXClips is temporarily closed for fundraising',
      fundraising: {
        goal: 100,
        current: 0,
        currency: 'USD',
        reason: 'We need $100 to reopen AFEXClips with proper infrastructure',
        breakdown: [
          {
            category: 'Server Infrastructure',
            description: 'High-performance servers for video streaming and storage',
            amount: 40
          },
          {
            category: 'Video Processing',
            description: 'Advanced video compression and optimization',
            amount: 30
          },
          {
            category: 'Payment System',
            description: 'Secure payment processing and subscription management',
            amount: 20
          },
          {
            category: 'User Experience',
            description: 'Smooth playback, fast loading, and reliable service',
            amount: 10
          }
        ]
      },
      clips: [],
      pagination: {
        current: 1,
        total: 0,
        hasNext: false,
        hasPrev: false,
      },
    });
  } catch (error) {
    console.error('Get clips error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/clips
// @desc    Create a new clip (AFEXClip) - TEMPORARILY DISABLED
// @access  Private
router.post(
  '/',
  auth,
  async (req, res) => {
    try {
      res.status(503).json({ 
        message: 'AFEXClips is temporarily closed for fundraising',
        fundraising: {
          goal: 100,
          current: 0,
          currency: 'USD',
          reason: 'We need $100 to reopen AFEXClips with proper infrastructure'
        }
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

// @route   GET /api/clips/fundraising
// @desc    Get fundraising information
// @access  Public
router.get('/fundraising', (req, res) => {
  res.json({
    status: 'active',
    goal: 100,
    current: 0,
    currency: 'USD',
    reason: 'We need $100 to reopen AFEXClips with proper infrastructure',
    breakdown: [
      {
        category: 'Server Infrastructure',
        description: 'High-performance servers for video streaming and storage',
        amount: 40,
        percentage: 40
      },
      {
        category: 'Video Processing',
        description: 'Advanced video compression and optimization',
        amount: 30,
        percentage: 30
      },
      {
        category: 'Payment System',
        description: 'Secure payment processing and subscription management',
        amount: 20,
        percentage: 20
      },
      {
        category: 'User Experience',
        description: 'Smooth playback, fast loading, and reliable service',
        amount: 10,
        percentage: 10
      }
    ],
    timeline: '2-3 weeks after goal is reached',
    benefits: [
      'Unlimited video uploads',
      'High-quality streaming',
      'Advanced video editing tools',
      'Premium features for creators',
      '24/7 support'
    ]
  });
});

// @route   POST /api/clips/donate
// @desc    Handle donation with Moniepoint and Bank Card integration
// @access  Public
router.post('/donate', [
  body('amount')
    .isFloat({ min: 1, max: 1000 })
    .withMessage('Donation amount must be between $1 and $1000'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('paymentMethod')
    .isIn(['moniepoint', 'card'])
    .withMessage('Payment method must be moniepoint or card')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, email, name, message, paymentMethod } = req.body;

    // Generate transaction ID
    const transactionId = `DON-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create donation record
    const donation = new Payment({
      amount,
      currency: 'USD',
      paymentMethod,
      transactionId,
      customer: {
        name,
        email
      },
      isDonation: true,
      donationType: 'afexclips',
      message,
      status: 'pending'
    });

    await donation.save();
    
    res.json({
      success: true,
      message: paymentMethod === 'moniepoint' 
        ? 'Please send payment to Moniepoint account: 1234567890 (AFEX Donations)'
        : 'Please complete your card payment below',
      paymentMethod,
      donation: {
        amount,
        email,
        name,
        message,
        timestamp: new Date(),
        transactionId,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Donation error:', error);
    res.status(500).json({ message: 'Server error processing donation' });
  }
});

// @route   POST /api/clips/payment-webhook
// @desc    Handle PayPal webhook for payment confirmations
// @access  Public
router.post('/payment-webhook', async (req, res) => {
  try {
    const { 
      payment_status, 
      txn_id, 
      mc_gross, 
      payer_email, 
      item_name,
      custom 
    } = req.body;

    console.log('PayPal webhook received:', req.body);

    // Verify PayPal webhook (in production, verify with PayPal)
    if (payment_status === 'Completed') {
      // Update donation status in database
      // TODO: Save to database
      console.log(`Payment completed: $${mc_gross} from ${payer_email}`);
      
      // Send confirmation email
      // TODO: Implement email sending
      
      res.status(200).json({ message: 'Webhook processed successfully' });
    } else {
      console.log(`Payment status: ${payment_status}`);
      res.status(200).json({ message: 'Webhook received' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// @route   GET /api/clips/donations
// @desc    Get all donations (admin only)
// @access  Private
router.get('/donations', auth, async (req, res) => {
  try {
    // TODO: Check if user is admin
    const donations = await Payment.find({ isDonation: true })
      .sort({ createdAt: -1 })
      .populate('customer.userId', 'username firstName lastName')
      .limit(50);

    const total = donations.reduce((sum, d) => sum + d.amount, 0);
    const count = donations.length;

    res.json({
      donations,
      total,
      count
    });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/clips/donations
// @desc    Create a new donation record
// @access  Public
router.post('/donations', [
  body('amount').isFloat({ min: 1 }),
  body('name').isLength({ min: 2 }),
  body('email').isEmail(),
  body('message').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, name, email, message, paymentMethod = 'moniepoint' } = req.body;

    // Generate transaction ID
    const transactionId = `DON-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create donation record
    const donation = new Payment({
      amount,
      currency: 'USD',
      paymentMethod,
      transactionId,
      customer: {
        name,
        email,
        userId: req.user?._id
      },
      isDonation: true,
      donationType: 'afexclips',
      message,
      status: 'pending'
    });

    await donation.save();

    res.status(201).json({
      success: true,
      message: 'Donation recorded successfully',
      donation: {
        id: donation._id,
        amount: donation.amount,
        transactionId: donation.transactionId,
        status: donation.status
      }
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/clips/donations/:id
// @desc    Update donation status
// @access  Private
router.put('/donations/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const donation = await Payment.findById(id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (status === 'completed') {
      await donation.markAsCompleted();
    } else if (status === 'failed') {
      await donation.markAsFailed({ code: 'MANUAL_UPDATE', message: 'Status updated manually' });
    } else {
      donation.status = status;
      await donation.save();
    }

    res.json({
      success: true,
      message: 'Donation status updated',
      donation: {
        id: donation._id,
        status: donation.status,
        amount: donation.amount
      }
    });
  } catch (error) {
    console.error('Update donation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/clips/fundraising-stats
// @desc    Get fundraising statistics
// @access  Public
router.get('/fundraising-stats', async (req, res) => {
  try {
    const goal = 100; // $100 goal
    
    // Get donation statistics
    const stats = await Payment.getDonationStats();
    const recentDonations = await Payment.getRecentDonations(5);
    
    const progress = Math.min((stats.totalAmount / goal) * 100, 100);
    
    res.json({
      goal,
      current: stats.totalAmount,
      currency: 'USD',
      totalDonations: stats.totalCount,
      donorCount: stats.totalCount, // Simplified - in real app, count unique donors
      averageDonation: stats.averageAmount || 0,
      recentDonations,
      progress: Math.round(progress)
    });
  } catch (error) {
    console.error('Get fundraising stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/clips/contact
// @desc    Contact form for fundraising inquiries
// @access  Public
router.post('/contact', [
  body('name').isLength({ min: 2, max: 100 }),
  body('email').isEmail(),
  body('subject').isLength({ min: 5, max: 200 }),
  body('message').isLength({ min: 10, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;

    // TODO: Send email notification
    console.log('Contact form submission:', { name, email, subject, message });

    res.json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon!'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 