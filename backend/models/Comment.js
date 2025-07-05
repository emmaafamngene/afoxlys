const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    clip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clip',
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure either post or clip is provided, but not both
commentSchema.pre('save', function (next) {
  if (!this.post && !this.clip) {
    return next(new Error('Comment must be associated with either a post or clip'));
  }
  if (this.post && this.clip) {
    return next(new Error('Comment cannot be associated with both post and clip'));
  }
  next();
});

// Index for efficient queries
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ clip: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: -1 });

// Virtual for like count
commentSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

// Virtual for reply count
commentSchema.virtual('replyCount').get(function () {
  return this.replies.length;
});

// Ensure virtuals are serialized
commentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema); 