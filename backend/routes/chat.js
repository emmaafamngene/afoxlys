const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');

// Get all conversations for the user
router.get('/conversations/:userId', auth, async (req, res) => {
  try {
    // Validate that the current user is requesting their own conversations
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access these conversations' });
    }

    const conversations = await Conversation.find({
      participants: req.params.userId,
    })
      .sort({ updatedAt: -1 })
      .populate('participants', 'username firstName lastName avatar');
    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
});

// Create or get a 1-on-1 conversation
router.post('/conversations', auth, async (req, res) => {
  const { userId1, userId2 } = req.body;
  try {
    // Validate that the current user is one of the participants
    if (req.user._id.toString() !== userId1 && req.user._id.toString() !== userId2) {
      return res.status(403).json({ message: 'Not authorized to create this conversation' });
    }

    let convo = await Conversation.findOne({
      participants: { $all: [userId1, userId2], $size: 2 },
    }).populate('participants', 'username firstName lastName avatar');
    
    if (!convo) {
      convo = await Conversation.create({ participants: [userId1, userId2] });
      await convo.populate('participants', 'username firstName lastName avatar');
    }
    
    res.json(convo);
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(500).json({ message: 'Error creating conversation' });
  }
});

// Get all messages for a conversation (not deleted)
router.get('/messages/:conversationId', auth, async (req, res) => {
  try {
    // Check if user is part of this conversation
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this conversation' });
    }

    const messages = await Message.find({
      conversation: req.params.conversationId,
    })
      .sort({ createdAt: 1 })
      .select('-__v');
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Send a message (for initial load, not real-time)
router.post('/messages', auth, async (req, res) => {
  const { conversationId, sender, recipient, content } = req.body;
  try {
    const message = await Message.create({
      conversation: conversationId,
      sender,
      recipient,
      content,
    });
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content,
      updatedAt: Date.now(),
    });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Error sending message' });
  }
});

module.exports = router; 