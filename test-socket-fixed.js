const io = require('socket.io-client');

console.log('🔍 Testing Fixed Socket.IO Connection...\n');

const socket = io('https://afoxlys.onrender.com', {
  transports: ['websocket', 'polling'],
  timeout: 15000,
  forceNew: true,
  upgrade: true,
  rememberUpgrade: false
});

let connected = false;

socket.on('connect', () => {
  connected = true;
  console.log('✅ Socket.IO connected successfully!');
  console.log('   Socket ID:', socket.id);
  console.log('   Transport:', socket.io.engine.transport.name);
  console.log('   Connected:', socket.connected);
  console.log('   Protocol:', socket.io.engine.protocol);
  
  // Test join event
  const testUserId = 'test-user-' + Date.now();
  socket.emit('join', testUserId);
  console.log('   Emitted join event for user:', testUserId);
  
  // Test a simple message
  setTimeout(() => {
    const testMessage = {
      conversationId: 'test-conversation',
      sender: testUserId,
      recipient: 'test-recipient',
      content: 'Test message from debug script'
    };
    
    console.log('   Emitting test message:', testMessage);
    socket.emit('send_message', testMessage);
  }, 2000);
  
  // Disconnect after 5 seconds
  setTimeout(() => {
    console.log('   Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 5000);
});

socket.on('connect_error', (error) => {
  console.log('❌ Socket.IO connection failed!');
  console.log('   Error:', error.message);
  console.log('   Error type:', error.type);
  console.log('   Description:', error.description);
  console.log('   Context:', error.context);
  
  if (error.message.includes('Transport unknown')) {
    console.log('🔧 This suggests a Socket.IO configuration issue');
  }
  
  process.exit(1);
});

socket.on('error', (error) => {
  console.log('❌ Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('🔍 Socket disconnected:', reason);
  if (connected) {
    console.log('✅ Test completed successfully!');
  }
});

// Listen for any messages back
socket.on('receive_message', (message) => {
  console.log('✅ Received message:', message);
});

socket.on('delivered', (data) => {
  console.log('✅ Message delivered:', data);
});

// Timeout after 20 seconds
setTimeout(() => {
  if (!connected) {
    console.log('❌ Test timeout after 20 seconds');
    socket.disconnect();
    process.exit(1);
  }
}, 20000); 