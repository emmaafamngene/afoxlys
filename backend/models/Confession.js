const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ConfessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000
  },
  emojiReactions: {
    fire: { type: Number, default: 0 },
    cry: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    laugh: { type: Number, default: 0 },
    heart: { type: Number, default: 0 }
  },
  replies: [ReplySchema],
  totalReactions: {
    type: Number,
    default: 0
  },
  isTrending: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Calculate total reactions
ConfessionSchema.pre('save', function(next) {
  this.totalReactions = Object.values(this.emojiReactions).reduce((sum, count) => sum + count, 0);
  next();
});

module.exports = mongoose.model('Confession', ConfessionSchema); 