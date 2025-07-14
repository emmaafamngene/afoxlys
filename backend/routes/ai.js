const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const { auth } = require('../middlewares/auth');
require('dotenv').config();

const router = express.Router();

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// POST /api/ai/chat
router.post('/chat', auth, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are AFEX AI, a helpful and friendly assistant for a social media platform.' },
        { role: 'user', content: message }
      ],
      max_tokens: 256,
      temperature: 0.7,
    });
    const aiResponse = completion.data.choices[0].message.content;
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('OpenAI error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get AI response.' });
  }
});

module.exports = router; 