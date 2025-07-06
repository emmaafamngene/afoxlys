const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const { auth } = require('../middlewares/auth');

// Get all confessions (most recent first)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, trending = false } = req.query;
    
    let query = {};
    if (trending === 'true') {
      query.isTrending = true;
    }
    
    const confessions = await Confession.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Confession.countDocuments(query);
    
    res.json({
      confessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Error fetching confessions:', err);
    res.status(500).json({ message: 'Error fetching confessions' });
  }
});

// Post a new confession (anonymous)
router.post('/', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Confession text is required' });
    }
    
    if (text.length > 1000) {
      return res.status(400).json({ message: 'Confession is too long (max 1000 characters)' });
    }
    
    const confession = await Confession.create({
      text: text.trim(),
      userId: req.user._id
    });
    
    console.log('✅ New confession posted:', confession._id);
    
    res.status(201).json(confession);
  } catch (err) {
    console.error('Error posting confession:', err);
    res.status(500).json({ message: 'Error posting confession' });
  }
});

// Update a confession
router.put('/:confessionId', auth, async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Confession text is required' });
    }
    
    if (text.length > 1000) {
      return res.status(400).json({ message: 'Confession is too long (max 1000 characters)' });
    }
    
    const confession = await Confession.findById(confessionId);
    if (!confession) {
      return res.status(404).json({ message: 'Confession not found' });
    }
    
    // Check if user owns the confession
    if (confession.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this confession' });
    }
    
    confession.text = text.trim();
    await confession.save();
    
    console.log('✅ Confession updated:', confessionId);
    
    res.json(confession);
  } catch (err) {
    console.error('Error updating confession:', err);
    res.status(500).json({ message: 'Error updating confession' });
  }
});

// Delete a confession
router.delete('/:confessionId', auth, async (req, res) => {
  try {
    const { confessionId } = req.params;
    
    const confession = await Confession.findById(confessionId);
    if (!confession) {
      return res.status(404).json({ message: 'Confession not found' });
    }
    
    // Check if user owns the confession
    if (confession.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this confession' });
    }
    
    await Confession.findByIdAndDelete(confessionId);
    
    console.log('✅ Confession deleted:', confessionId);
    
    res.json({ message: 'Confession deleted successfully' });
  } catch (err) {
    console.error('Error deleting confession:', err);
    res.status(500).json({ message: 'Error deleting confession' });
  }
});

// React to a confession
router.post('/:confessionId/react', auth, async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { reactionType } = req.body; // 'fire', 'cry', 'love', 'laugh', 'heart'
    
    const validReactions = ['fire', 'cry', 'love', 'laugh', 'heart'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }
    
    const confession = await Confession.findById(confessionId);
    if (!confession) {
      return res.status(404).json({ message: 'Confession not found' });
    }
    
    // Increment the reaction count
    confession.emojiReactions[reactionType] += 1;
    await confession.save();
    
    console.log(`✅ Reaction ${reactionType} added to confession:`, confessionId);
    
    res.json(confession);
  } catch (err) {
    console.error('Error reacting to confession:', err);
    res.status(500).json({ message: 'Error reacting to confession' });
  }
});

// Reply to a confession (anonymous)
router.post('/:confessionId/reply', auth, async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Reply text is required' });
    }
    
    if (text.length > 500) {
      return res.status(400).json({ message: 'Reply is too long (max 500 characters)' });
    }
    
    const confession = await Confession.findById(confessionId);
    if (!confession) {
      return res.status(404).json({ message: 'Confession not found' });
    }
    
    confession.replies.push({
      text: text.trim()
    });
    
    await confession.save();
    
    console.log('✅ Reply added to confession:', confessionId);
    
    res.json(confession);
  } catch (err) {
    console.error('Error replying to confession:', err);
    res.status(500).json({ message: 'Error replying to confession' });
  }
});

// Get trending confessions
router.get('/trending', async (req, res) => {
  try {
    const confessions = await Confession.find({ isTrending: true })
      .sort({ totalReactions: -1, createdAt: -1 })
      .limit(10);
    
    res.json(confessions);
  } catch (err) {
    console.error('Error fetching trending confessions:', err);
    res.status(500).json({ message: 'Error fetching trending confessions' });
  }
});

module.exports = router; 