const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badgeName: {
    type: String,
    required: true,
    enum: [
      'Hot Shot',      // 50 🔥 votes received
      'Deep Soul',     // 10 confessions posted
      'Vibe Starter',  // 20 reactions received on confessions
      'Top Dog',       // Weekly leaderboard #1
      'Swipe Master',  // 100 votes given
      'Confession King', // 50 confessions posted
      'Reaction Queen',  // 100 reactions given
      'Trending Star'    // 5 trending confessions
    ]
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Compound index to ensure one badge per user per type
BadgeSchema.index({ userId: 1, badgeName: 1 }, { unique: true });

module.exports = mongoose.model('Badge', BadgeSchema); 