const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { auth } = require('../middlewares/auth');
const AIChat = require('../models/AIChat');
require('dotenv').config();

const router = express.Router();

console.log('🔧 AI Route: Loading environment variables...');
console.log('🔧 AI Route: GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('🔧 AI Route: GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log('🔧 AI Route: GEMINI_API_KEY starts with:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'undefined');

// Check if API key is available
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'your-gemini-api-key-here') {
  console.error('❌ GEMINI_API_KEY not set or invalid in environment variables');
  console.error('❌ Current value:', apiKey);
}

let genAI = null;
try {
  if (apiKey && apiKey !== 'your-gemini-api-key-here') {
    console.log('🔧 AI Route: Initializing GoogleGenerativeAI...');
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ AI Route: GoogleGenerativeAI initialized successfully');
  } else {
    console.error('❌ AI Route: Cannot initialize GoogleGenerativeAI - no valid API key');
  }
} catch (error) {
  console.error('❌ AI Route: Error initializing GoogleGenerativeAI:', error);
}

// GET /api/ai/chats - Get all AI chats for the user
router.get('/chats', auth, async (req, res) => {
  try {
    console.log('🤖 AI Route: Getting chats for user:', req.user._id);
    
    const chats = await AIChat.find({ 
      userId: req.user._id,
      isActive: true 
    })
    .sort({ updatedAt: -1 })
    .select('title messages createdAt updatedAt')
    .limit(50);
    
    console.log('✅ AI Route: Found', chats.length, 'chats');
    
    res.json({
      success: true,
      chats: chats.map(chat => ({
        _id: chat._id,
        title: chat.title,
        messageCount: chat.messages.length,
        lastMessage: chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].content.substring(0, 100) : '',
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }))
    });
  } catch (error) {
    console.error('❌ AI Route: Error getting chats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve chat history' 
    });
  }
});

// GET /api/ai/chats/:chatId - Get specific chat with messages
router.get('/chats/:chatId', auth, async (req, res) => {
  try {
    console.log('🤖 AI Route: Getting chat:', req.params.chatId, 'for user:', req.user._id);
    
    const chat = await AIChat.findOne({
      _id: req.params.chatId,
      userId: req.user._id,
      isActive: true
    });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }
    
    console.log('✅ AI Route: Found chat with', chat.messages.length, 'messages');
    
    res.json({
      success: true,
      chat: {
        _id: chat._id,
        title: chat.title,
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ AI Route: Error getting chat:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve chat' 
    });
  }
});

// POST /api/ai/chats - Create a new chat
router.post('/chats', auth, async (req, res) => {
  try {
    console.log('🤖 AI Route: Creating new chat for user:', req.user._id);
    
    const newChat = new AIChat({
      userId: req.user._id,
      title: 'New Chat',
      messages: []
    });
    
    await newChat.save();
    
    console.log('✅ AI Route: Created new chat:', newChat._id);
    
    res.json({
      success: true,
      chat: {
        _id: newChat._id,
        title: newChat.title,
        messages: [],
        createdAt: newChat.createdAt,
        updatedAt: newChat.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ AI Route: Error creating chat:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create new chat' 
    });
  }
});

// DELETE /api/ai/chats/:chatId - Delete a chat
router.delete('/chats/:chatId', auth, async (req, res) => {
  try {
    console.log('🤖 AI Route: Deleting chat:', req.params.chatId, 'for user:', req.user._id);
    
    const chat = await AIChat.findOneAndUpdate(
      {
        _id: req.params.chatId,
        userId: req.user._id
      },
      { isActive: false },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }
    
    console.log('✅ AI Route: Deleted chat:', req.params.chatId);
    
    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('❌ AI Route: Error deleting chat:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete chat' 
    });
  }
});

// POST /api/ai/chat - Send message to AI (with chat history)
router.post('/chat', auth, async (req, res) => {
  console.log('🤖 AI Route: Chat request received');
  console.log('🤖 AI Route: Request body:', req.body);
  console.log('🤖 AI Route: User authenticated:', !!req.user);
  console.log('🤖 AI Route: User ID:', req.user?._id);
  
  const { message, chatId } = req.body;
  
  if (!message || !message.trim()) {
    console.error('❌ AI Route: No message provided');
    return res.status(400).json({ error: 'Message is required.' });
  }

  console.log('🤖 AI Route: Processing message:', message.substring(0, 50) + (message.length > 50 ? '...' : ''));
  console.log('🤖 AI Route: Chat ID:', chatId);

  // Check if API key is configured
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.error('❌ AI Route: GEMINI_API_KEY not configured');
    console.error('❌ AI Route: Current API key value:', apiKey);
    return res.status(500).json({ 
      error: 'AI service not configured. Please set up the GEMINI_API_KEY environment variable.' 
    });
  }

  // Check if genAI is initialized
  if (!genAI) {
    console.error('❌ AI Route: GoogleGenerativeAI not initialized');
    return res.status(500).json({ 
      error: 'AI service not properly initialized. Please check the API key configuration.' 
    });
  }

  try {
    let chat;
    
    // If chatId is provided, get existing chat, otherwise create new one
    if (chatId) {
      chat = await AIChat.findOne({
        _id: chatId,
        userId: req.user._id,
        isActive: true
      });
      
      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }
    } else {
      // Create new chat
      chat = new AIChat({
        userId: req.user._id,
        title: 'New Chat',
        messages: []
      });
      await chat.save();
      console.log('✅ AI Route: Created new chat:', chat._id);
    }
    
    // Add user message to chat
    await chat.addMessage('user', message);
    
    // Get recent messages for context (last 10 messages)
    const recentMessages = chat.getRecentMessages(10);
    console.log('🤖 AI Route: Using', recentMessages.length, 'messages for context');
    
    // Build conversation history for AI
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));
    
    console.log('🤖 AI Route: Getting generative model...');
    const model = genAI.getGenerativeModel({ model: "gemini-pro-1.5" });
    console.log('✅ AI Route: Generative model obtained');
    
    // Create chat session with history
    const chatSession = model.startChat({
      history: conversationHistory.slice(0, -1), // Exclude the current user message
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });
    
    console.log('📤 AI Route: Sending request to Gemini...');
    console.log('📤 AI Route: Message length:', message.length);
    console.log('📤 AI Route: Context messages:', conversationHistory.length - 1);
    
    const startTime = Date.now();
    const result = await chatSession.sendMessage(message);
    const endTime = Date.now();
    
    console.log('✅ AI Route: Gemini response received in', endTime - startTime, 'ms');
    console.log('✅ AI Route: Result object:', typeof result);
    console.log('✅ AI Route: Result has response property:', !!result.response);
    
    if (!result.response) {
      throw new Error('No response received from Gemini API');
    }
    
    const aiResponse = result.response.text();
    console.log('✅ AI Route: AI response extracted:', aiResponse.substring(0, 50) + (aiResponse.length > 50 ? '...' : ''));
    console.log('✅ AI Route: Response length:', aiResponse.length);
    
    // Add AI response to chat
    await chat.addMessage('assistant', aiResponse);
    
    // Update chat title if this is the first message
    if (chat.messages.length === 2) { // User message + AI response
      try {
        const titleModel = genAI.getGenerativeModel({ model: "gemini-pro-1.5" });
        const titlePrompt = `Generate a short, descriptive title (max 50 characters) for this conversation based on the user's first message: "${message}"`;
        const titleResult = await titleModel.generateContent(titlePrompt);
        const generatedTitle = titleResult.response.text().replace(/["""]/g, '').trim();
        
        if (generatedTitle && generatedTitle.length <= 50) {
          chat.title = generatedTitle;
          await chat.save();
          console.log('✅ AI Route: Updated chat title to:', generatedTitle);
        }
      } catch (titleError) {
        console.log('⚠️ AI Route: Could not generate title, using default');
      }
    }
    
    res.json({ 
      success: true,
      response: aiResponse,
      chatId: chat._id,
      chat: {
        _id: chat._id,
        title: chat.title,
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
    });
    console.log('✅ AI Route: Response sent successfully');
    
  } catch (error) {
    console.error('❌ AI Route: Gemini API error details:');
    console.error('❌ AI Route: Error name:', error.name);
    console.error('❌ AI Route: Error message:', error.message);
    console.error('❌ AI Route: Error stack:', error.stack);
    console.error('❌ AI Route: Full error object:', JSON.stringify(error, null, 2));
    
    // Provide more specific error messages
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      console.error('❌ AI Route: API key authentication error');
      return res.status(500).json({ 
        error: 'Invalid API key. Please check your GEMINI_API_KEY configuration.' 
      });
    } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
      console.error('❌ AI Route: Quota/rate limit error');
      return res.status(500).json({ 
        error: 'API quota exceeded. Please try again later or upgrade your plan.' 
      });
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      console.error('❌ AI Route: Network error');
      return res.status(500).json({ 
        error: 'Network error. Please check your internet connection and try again.' 
      });
    } else if (error.message.includes('model') || error.message.includes('gemini-pro')) {
      console.error('❌ AI Route: Model error');
      return res.status(500).json({ 
        error: 'AI model error. Please try again later.' 
      });
    } else {
      console.error('❌ AI Route: Unknown error type');
      return res.status(500).json({ 
        error: `AI service error: ${error.message}` 
      });
    }
  }
});

console.log('🔧 AI Route: Route setup complete');

module.exports = router; 