const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    media: [
      {
        type: {
          type: String,
          enum: ['image', 'video'],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        thumbnail: String,
        duration: Number, // for videos
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      type: String,
      trim: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search functionality
postSchema.index({ content: 'text', tags: 'text' });

// Index for feed queries
postSchema.index({ author: 1, createdAt: -1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function () {
  return this.comments.length;
});

// Ensure virtuals are serialized
postSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Post', postSchema); 