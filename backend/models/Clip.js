const mongoose = require('mongoose');

const clipSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      max: 90, // 90 seconds max
      min: 1,
    },
    sourcePost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      // Optional - only if clip was created from a post
    },
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
    views: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      enum: [
        'general',
        'entertainment',
        'education',
        'comedy',
        'music',
        'dance',
        'food',
        'travel',
        'fitness',
        'fashion',
        'sports',
        'gaming',
        'technology',
        'lifestyle',
        'other',
      ],
      default: 'general',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    aspectRatio: {
      type: String,
      enum: ['9:16', '1:1', '16:9'],
      default: '9:16', // Vertical format for AFEXClips
    },
  },
  {
    timestamps: true,
  }
);

// Index for search functionality
clipSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Index for feed queries
clipSchema.index({ author: 1, createdAt: -1 });
clipSchema.index({ category: 1, createdAt: -1 });
clipSchema.index({ isFeatured: 1, createdAt: -1 });
clipSchema.index({ sourcePost: 1 }); // Index for source post queries

// Virtual for like count
clipSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

// Virtual for comment count
clipSchema.virtual('commentCount').get(function () {
  return this.comments.length;
});

// Ensure virtuals are serialized
clipSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Clip', clipSchema); 