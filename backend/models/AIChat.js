const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const aiChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [aiMessageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Update the updatedAt field when messages are modified
aiChatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add a method to add a message to the chat
aiChatSchema.methods.addMessage = function(role, content) {
  this.messages.push({
    role,
    content,
    timestamp: new Date()
  });
  this.updatedAt = new Date();
  return this.save();
};

// Add a method to get the last few messages for context
aiChatSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit);
};

// Add a method to get conversation summary for title generation
aiChatSchema.methods.getConversationSummary = function() {
  const userMessages = this.messages
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content)
    .join(' ');
  
  return userMessages.substring(0, 100) + (userMessages.length > 100 ? '...' : '');
};

module.exports = mongoose.model('AIChat', aiChatSchema); 