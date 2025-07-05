# AFEX Chat System

A modern, real-time chat system inspired by Snapchat and Instagram DMs, built with React, Socket.IO, and Tailwind CSS.

## 🚀 Features

- **Real-time messaging** with Socket.IO
- **Snapchat-style disappearing messages** (60-second timer after viewing)
- **User search and following list** for starting new conversations
- **Modern UI** with dark/light mode support
- **Message delivery status** (delivered, seen)
- **Responsive design** for mobile and desktop

## 📁 Components

### `Chat.js` (Main Page)
- Manages chat state and Socket.IO connections
- Handles conversation selection and message sending
- Integrates all chat components

### `ChatSidebar.js`
- Displays list of recent conversations
- Shows user avatars, usernames, and last messages
- "New Chat" button to open user search modal
- Responsive design (collapses on mobile)

### `ChatWindow.js`
- Main chat interface with message display
- Handles message input and sending
- Manages disappearing message animations
- Shows conversation header with user info

### `NewChatModal.js`
- Modal for starting new conversations
- User search functionality
- Following list display
- Tabbed interface (Following/Search Results)

### `MessageBubble.js`
- Individual message component
- Handles Snapchat-style viewing behavior
- Displays delivery status and timestamps
- Manages deletion countdown timer

## 🔥 Snapchat-Style Features

### Message Lifecycle
1. **Sent** → Message appears in chat
2. **Delivered** → Recipient receives message
3. **Viewed** → Recipient clicks on message
4. **Fading** → Message starts to fade after 2 seconds
5. **Deleted** → Message disappears after 60 seconds total

### Viewing Behavior
- Messages from others show "👆 Click to view"
- Once clicked, message starts 60-second deletion countdown
- Shows "🔥 Deleting in Xs..." during countdown
- Shows "🔥 Fading out..." during fade animation

## 🎨 UI/UX Features

### Design System
- **Glassmorphism** effects with backdrop blur
- **Smooth animations** and transitions
- **Dark/light mode** support
- **Responsive layout** for all screen sizes

### Message Bubbles
- **Own messages**: Blue background, right-aligned
- **Other messages**: White background, left-aligned
- **Hover effects** for interactive elements
- **Delivery status** icons (checkmarks)

### Conversation List
- **Online indicators** (green dots)
- **Last message preview**
- **Timestamp display**
- **Active conversation highlighting**

## 🔌 API Integration

### Required Backend Endpoints
- `GET /api/chat/conversations/:userId` - Fetch user conversations
- `GET /api/chat/messages/:conversationId` - Fetch conversation messages
- `POST /api/chat/conversations` - Create new conversation
- `GET /api/users/:userId/following` - Fetch user's following list
- `GET /api/users/search?q=query` - Search users

### Socket.IO Events
- `join` - Join user's room
- `send_message` - Send new message
- `receive_message` - Receive new message
- `view_message` - Mark message as viewed
- `delivered` - Message delivery confirmation
- `seen` - Message seen confirmation
- `message_deleted` - Message deletion notification

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install socket.io-client axios
   ```

2. **Set environment variables**:
   ```env
   REACT_APP_API_URL=https://afoxlys.onrender.com/api
REACT_APP_SOCKET_URL=https://afoxlys.onrender.com
   ```

3. **Import and use**:
   ```jsx
   import Chat from './pages/Chat';
   
   // In your router
   <Route path="/chat" element={<Chat />} />
   ```

## 🎯 Future Enhancements

- **Media messages** (images, videos)
- **Voice messages**
- **Message reactions**
- **Chat streaks** (🔥 counter)
- **Group conversations**
- **Message encryption**
- **Push notifications**

## 🐛 Troubleshooting

### Common Issues
1. **Socket connection fails**: Check `REACT_APP_SOCKET_URL`
2. **API 404 errors**: Verify backend routes are registered
3. **Messages not disappearing**: Check Socket.IO event handlers
4. **User search not working**: Ensure backend search endpoint exists

### Debug Tips
- Check browser console for Socket.IO connection status
- Verify API endpoints with Postman/curl
- Test with multiple browser tabs for real-time features 