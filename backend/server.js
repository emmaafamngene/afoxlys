const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const { router: notificationRoutes, createNotification } = require('./routes/notifications');
const chatRoutes = require('./routes/chat');
const bodyParser = require('body-parser');
const xpAwarder = require('./middlewares/xpAwarder');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// CORS configuration - MUST come before other middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://afex-app.netlify.app',
      'https://afex.netlify.app',
      'https://afoxly.netlify.app'
    ];
    
    // Log CORS origin for debugging
    console.log('🔍 CORS Origin Check:', origin);
    
    // Check if origin is in allowed list or is a Netlify subdomain
    if (allowedOrigins.includes(origin) || origin.endsWith('.netlify.app')) {
      console.log('✅ CORS Origin Allowed:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS Origin Blocked:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  exposedHeaders: ['Content-Length', 'X-Requested-With']
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Additional CORS headers middleware for extra safety
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'https://afex-app.netlify.app',
    'https://afex.netlify.app',
    'https://afoxly.netlify.app'
  ];
  
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.netlify.app'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
});

// Other middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files with CORS headers for images
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', xpAwarder, require('./routes/posts'));
app.use('/api/clips', xpAwarder, require('./routes/clips'));
app.use('/api/comments', xpAwarder, require('./routes/comments'));
app.use('/api/likes', xpAwarder, require('./routes/likes'));
app.use('/api/follow', xpAwarder, require('./routes/follow'));
app.use('/api/search', require('./routes/search'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/confessions', xpAwarder, require('./routes/confessions'));
app.use('/api/swipe', xpAwarder, require('./routes/swipe'));

// Patch the POST /api/chat/conversations route to emit a socket event
app.post('/api/chat/conversations', require('./middlewares/auth').auth, async (req, res) => {
  const { userId1, userId2 } = req.body;
  try {
    if (req.user._id.toString() !== userId1 && req.user._id.toString() !== userId2) {
      return res.status(403).json({ message: 'Not authorized to create this conversation' });
    }
    let convo = await Conversation.findOne({
      participants: { $all: [userId1, userId2], $size: 2 },
    }).populate('participants', 'username firstName lastName avatar');
    let isNew = false;
    if (!convo) {
      convo = await Conversation.create({ participants: [userId1, userId2] });
      await convo.populate('participants', 'username firstName lastName avatar');
      isNew = true;
    }
    res.json(convo);
    // Emit to the other participant if new
    if (isNew) {
      const recipientId = req.user._id.toString() === userId1 ? userId2 : userId1;
      const recipientSocket = onlineUsers.get(recipientId);
      if (recipientSocket) {
        io.to(recipientSocket).emit('newConversation', convo);
      }
    }
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(500).json({ message: 'Error creating conversation' });
  }
});

app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', require('./routes/leaderboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AFEX API is running',
    socket: {
      onlineUsers: onlineUsers.size,
      transports: ['websocket', 'polling']
    }
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin,
    corsHeaders: {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers')
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// In-memory map of userId <-> socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ Socket.IO: User connected', socket.id);
  console.log('🔍 Socket transport:', socket.conn.transport.name);
  console.log('🔍 Socket remote address:', socket.handshake.address);

  // User joins chat (register userId)
  socket.on('join', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} joined chat (socket ${socket.id})`);
  });

  // Send message
  socket.on('send_message', async (data) => {
    // data: { conversationId, sender, recipient, content }
    console.log('🔍 Socket.IO send_message received:', data);
    
    try {
      // Validate required fields
      if (!data.conversationId || !data.sender || !data.recipient || !data.content) {
        console.error('❌ Missing required fields:', {
          conversationId: !!data.conversationId,
          sender: !!data.sender,
          recipient: !!data.recipient,
          content: !!data.content
        });
        return;
      }

      // Save message to DB
      const message = await Message.create({
        conversation: data.conversationId,
        sender: data.sender,
        recipient: data.recipient,
        content: data.content,
        delivered: false,
        viewed: false,
      });
      
      console.log('✅ Message saved to DB:', message._id);
      
      // Update conversation lastMessage/updatedAt
      await Conversation.findByIdAndUpdate(data.conversationId, {
        lastMessage: data.content,
        updatedAt: Date.now(),
      });
      
      // Emit to recipient if online
      const recipientSocket = onlineUsers.get(data.recipient);
      if (recipientSocket) {
        io.to(recipientSocket).emit('receive_message', message);
        // Mark as delivered
        message.delivered = true;
        await message.save();
        // Notify sender
        socket.emit('delivered', { messageId: message._id });
        console.log('✅ Message delivered to recipient');
      } else {
        console.log('ℹ️ Recipient not online:', data.recipient);
      }
      
      // Also emit back to sender for immediate UI update
      socket.emit('receive_message', message);
      
      // Create notification for recipient
      try {
        // Get sender information for better notification
        const User = require('./models/User');
        const sender = await User.findById(data.sender).select('firstName lastName username avatar');
        const senderName = sender ? (sender.firstName || sender.username) : 'Someone';
        
        await createNotification(
          data.recipient,
          data.sender,
          'message',
          'New Message',
          `${senderName}: ${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`,
          data.conversationId,
          null,
          { conversationId: data.conversationId }
        );
        
        // Emit notification to recipient
        const recipientSocket = onlineUsers.get(data.recipient);
        if (recipientSocket) {
          io.to(recipientSocket).emit('newMessage', {
            senderName: senderName,
            senderAvatar: sender?.avatar
          });
        }
      } catch (err) {
        console.error('Error creating message notification:', err);
      }
      
    } catch (err) {
      console.error('Socket.IO send_message error:', err);
    }
  });

  // View message (mark as viewed, emit seen, schedule deletion)
  socket.on('view_message', async ({ messageId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;
      message.viewed = true;
      message.readAt = new Date();
      await message.save();
      // Notify sender
      const senderSocket = onlineUsers.get(message.sender.toString());
      if (senderSocket) {
        io.to(senderSocket).emit('seen', { messageId });
      }
      // Schedule deletion after 60s
      setTimeout(async () => {
        await Message.findByIdAndDelete(messageId);
      }, 60000);
    } catch (err) {
      console.error('Socket.IO view_message error:', err);
    }
  });

  // New follow notification
  socket.on('new_follow', async (data) => {
    try {
      await createNotification(
        data.followedUserId,
        data.followerId,
        'follow',
        'New Follower',
        `${data.followerName} started following you`,
        null,
        null,
        { followerId: data.followerId }
      );
      
      // Emit to followed user
      const followedUserSocket = onlineUsers.get(data.followedUserId);
      if (followedUserSocket) {
        io.to(followedUserSocket).emit('newFollow', {
          followerName: data.followerName,
          followerAvatar: data.followerAvatar
        });
      }
    } catch (err) {
      console.error('Error creating follow notification:', err);
    }
  });

  // New like notification
  socket.on('new_like', async (data) => {
    try {
      await createNotification(
        data.contentOwnerId,
        data.likerId,
        'like',
        'New Like',
        `${data.likerName} liked your ${data.contentType}`,
        data.contentId,
        data.contentType,
        { contentId: data.contentId, contentType: data.contentType }
      );
      
      // Emit to content owner
      const contentOwnerSocket = onlineUsers.get(data.contentOwnerId);
      if (contentOwnerSocket) {
        io.to(contentOwnerSocket).emit('newLike', {
          likerName: data.likerName,
          likerAvatar: data.likerAvatar,
          contentType: data.contentType
        });
      }
    } catch (err) {
      console.error('Error creating like notification:', err);
    }
  });

  // New comment notification
  socket.on('new_comment', async (data) => {
    try {
      await createNotification(
        data.contentOwnerId,
        data.commenterId,
        'comment',
        'New Comment',
        `${data.commenterName} commented on your ${data.contentType}`,
        data.contentId,
        data.contentType,
        { contentId: data.contentId, contentType: data.contentType }
      );
      
      // Emit to content owner
      const contentOwnerSocket = onlineUsers.get(data.contentOwnerId);
      if (contentOwnerSocket) {
        io.to(contentOwnerSocket).emit('newComment', {
          commenterName: data.commenterName,
          commenterAvatar: data.commenterAvatar,
          contentType: data.contentType
        });
      }
    } catch (err) {
      console.error('Error creating comment notification:', err);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.IO: User disconnected', socket.id, 'Reason:', reason);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log(`User ${socket.userId} removed from online users`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io }; 