const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    coverPhoto: {
      type: String,
      default: '',
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    // Leveling system fields
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    loginStreak: {
      type: Number,
      default: 0,
    },
    lastLoginDate: {
      type: Date,
      default: Date.now,
    },
    // Premium subscription fields
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiresAt: {
      type: Date,
    },
    premiumPlan: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    premiumPaymentHistory: [{
      amount: Number,
      currency: {
        type: String,
        default: 'NGN',
      },
      transactionId: String,
      paymentDate: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for search functionality
userSchema.index({ username: 'text', firstName: 'text', lastName: 'text' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.email;
  return userObject;
};

// Virtual for follower count
userSchema.virtual('followerCount').get(function () {
  return this.followers ? this.followers.length : 0;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function () {
  return this.following ? this.following.length : 0;
});

// Ensure virtuals are serialized
userSchema.set('toJSON', { virtuals: true });

// Premium subscription methods
userSchema.methods.activatePremium = function(plan = 'monthly', duration = 30) {
  this.isPremium = true;
  this.premiumPlan = plan;
  
  const expiry = new Date();
  if (plan === 'yearly') {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setDate(expiry.getDate() + duration);
  }
  
  this.premiumExpiresAt = expiry;
  return this.save();
};

userSchema.methods.isPremiumActive = function() {
  if (!this.isPremium) return false;
  if (!this.premiumExpiresAt) return false;
  return this.premiumExpiresAt > new Date();
};

userSchema.methods.addPaymentRecord = function(amount, transactionId, status = 'completed') {
  this.premiumPaymentHistory.push({
    amount,
    transactionId,
    status,
  });
  return this.save();
};

userSchema.methods.getDaysUntilExpiry = function() {
  if (!this.isPremiumActive()) return 0;
  const now = new Date();
  const diffTime = this.premiumExpiresAt - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = mongoose.model('User', userSchema); 