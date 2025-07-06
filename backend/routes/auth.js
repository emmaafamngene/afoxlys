const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');
const { updateLoginStreak } = require('../middlewares/xpAwarder');
const { calculateProgress, getXPForNextLevel, getXPForCurrentLevel } = require('../utils/levelCalculator');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET not set, using fallback secret');
  }
  return jwt.sign({ userId }, jwtSecret, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('firstName')
      .notEmpty()
      .withMessage('First name is required'),
    body('lastName')
      .notEmpty()
      .withMessage('Last name is required'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({
          message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        firstName,
        lastName,
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: user.getPublicProfile(),
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      // Check for specific MongoDB errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
        });
      }
      
      // Check for validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          message: messages.join(', ')
        });
      }
      
      // Check for JWT secret missing
      if (error.message && error.message.includes('JWT_SECRET')) {
        console.error('JWT_SECRET environment variable is missing');
        return res.status(500).json({ message: 'Server configuration error' });
      }
      
      res.status(500).json({ message: 'Server error', details: error.message });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user with email or username
// @access  Public
router.post(
  '/login',
  [
    body('emailOrUsername')
      .notEmpty()
      .withMessage('Email or username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { emailOrUsername, password } = req.body;

      // Find user by email or username
      const user = await User.findOne({
        $or: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      });
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken(user._id);

      // Update last active and handle login streak
      user.lastActive = new Date();
      const streakXP = await updateLoginStreak(user);

      // Get level information
      const userProfile = user.getPublicProfile();
      const levelInfo = {
        level: user.level,
        xp: user.xp,
        progress: calculateProgress(user.xp, user.level),
        xpForNextLevel: getXPForNextLevel(user.level),
        xpForCurrentLevel: getXPForCurrentLevel(user.level),
        loginStreak: user.loginStreak,
        streakXP: streakXP
      };

      res.json({
        message: 'Login successful',
        token,
        user: { ...userProfile, ...levelInfo },
        levelUp: streakXP > 0 ? {
          message: `🔥 ${user.loginStreak}-day login streak! +${streakXP} XP`,
          streakXP,
          loginStreak: user.loginStreak
        } : null
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const userProfile = req.user.getPublicProfile();
    const levelInfo = {
      level: req.user.level,
      xp: req.user.xp,
      progress: calculateProgress(req.user.xp, req.user.level),
      xpForNextLevel: getXPForNextLevel(req.user.level),
      xpForCurrentLevel: getXPForCurrentLevel(req.user.level),
      loginStreak: req.user.loginStreak
    };

    res.json({
      user: { ...userProfile, ...levelInfo },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    // Update last active
    req.user.lastActive = new Date();
    await req.user.save();

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 