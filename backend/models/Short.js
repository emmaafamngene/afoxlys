const mongoose = require('mongoose');

const shortSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caption: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  mediaUrl: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'image'],
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
shortSchema.index({ author: 1, createdAt: -1 });
shortSchema.index({ likes: 1 });
shortSchema.index({ createdAt: -1 });

// Virtual for like count
shortSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
shortSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Ensure virtuals are serialized
shortSchema.set('toJSON', { virtuals: true });
shortSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Short', shortSchema); 