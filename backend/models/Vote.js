const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  voteType: {
    type: String,
    enum: ['hot', 'not'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index to ensure one vote per user per post
VoteSchema.index({ voterId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema); 