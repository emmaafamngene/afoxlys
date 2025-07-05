const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Basic payment info
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer'],
    required: true
  },
  
  // Transaction details
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentIntentId: {
    type: String,
    sparse: true
  },
  refundId: {
    type: String,
    sparse: true
  },
  
  // Customer info
  customer: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true
    }
  },
  
  // Donation specific fields
  isDonation: {
    type: Boolean,
    default: false
  },
  donationType: {
    type: String,
    enum: ['afexclips', 'general', 'feature_request'],
    default: 'general'
  },
  message: {
    type: String,
    maxlength: 1000
  },
  
  // Metadata
  metadata: {
    type: Map,
    of: String
  },
  
  // Timestamps
  processedAt: Date,
  refundedAt: Date,
  
  // Error info
  error: {
    code: String,
    message: String
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ 'customer.email': 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ isDonation: 1, status: 1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Methods
paymentSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.processedAt = new Date();
  return this.save();
};

paymentSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.error = error;
  return this.save();
};

paymentSchema.methods.refund = function(refundId, amount) {
  this.status = 'refunded';
  this.refundId = refundId;
  this.refundedAt = new Date();
  if (amount) {
    this.amount = amount;
  }
  return this.save();
};

// Static methods
paymentSchema.statics.getDonationStats = async function() {
  const stats = await this.aggregate([
    {
      $match: {
        isDonation: true,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalCount: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalAmount: 0,
    totalCount: 0,
    averageAmount: 0
  };
};

paymentSchema.statics.getRecentDonations = async function(limit = 10) {
  return this.find({
    isDonation: true,
    status: 'completed'
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('amount customer.name message createdAt')
  .lean();
};

module.exports = mongoose.model('Payment', paymentSchema); 