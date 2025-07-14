const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { auth } = require('../middlewares/auth');
require('dotenv').config();

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/ai/chat
router.post('/chat', auth, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `You are AFEX AI, a helpful and friendly assistant for a social media platform. 
    Respond to the user's message in a conversational and helpful way. 
    Keep responses concise and engaging.
    
    User message: ${message}`;
    
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
    
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: 'Failed to get AI response.' });
  }
});

module.exports = router; 