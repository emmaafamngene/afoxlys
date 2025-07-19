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
const { xpAwarder } = require('./middlewares/xpAwarder');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

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

const allowedOrigins = [
  'https://afoxly.netlify.app',
  'http://localhost:3000',
  // Add more if needed
];

app.use(cors({
  origin: function(origin, callback) {
    console.log('CORS check for origin:', origin);
    if (!origin) return callback(null, true); // allow non-browser requests
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.netlify.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
app.options('*', cors({
  origin: function(origin, callback) {
    console.log('CORS preflight check for origin:', origin);
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.netlify.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

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
app.use('/api/posts', require('./routes/posts'));
app.use('/api/clips', xpAwarder, require('./routes/clips'));
app.use('/api/comments', xpAwarder, require('./routes/comments'));
app.use('/api/likes', xpAwarder, require('./routes/likes'));
const { router: followRoutes, setSocketIO } = require('./routes/follow');
app.use('/api/follow', xpAwarder, followRoutes);
app.use('/api/search', require('./routes/search'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/confessions', require('./routes/confessions'));
app.use('/api/shorts', require('./routes/shorts'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/ai', require('./routes/ai'));

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

// Set socket.io instance for follow routes
setSocketIO(io);

app.get('/api/agora/token', (req, res) => {
  const channelName = req.query.channel;
  const uid = req.query.uid || 0; // 0 means let Agora assign a UID
  const role = req.query.role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  if (!channelName) {
    return res.status(400).json({ error: 'channel is required' });
  }

  const expireTimeSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTs = currentTimestamp + expireTimeSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    Number(uid),
    role,
    privilegeExpireTs
  );

  res.json({ token });
});

// --- WebRTC Signaling for Calls ---
let users = {};
io.on('connection', socket => {
  console.log('New user connected');

  socket.on('register', userId => {
    users[userId] = socket.id;
    socket.userId = userId;
  });

  socket.on('call-user', ({ to, offer }) => {
    const target = users[to];
    if (target) {
      io.to(target).emit('incoming-call', {
        from: socket.userId,
        offer
      });
    }
  });

  socket.on('answer-call', ({ to, answer }) => {
    const target = users[to];
    if (target) {
      io.to(target).emit('call-answered', { answer });
    }
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    const target = users[to];
    if (target) {
      io.to(target).emit('ice-candidate', { candidate });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) delete users[socket.userId];
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io }; 