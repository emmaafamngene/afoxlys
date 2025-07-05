const io = require('socket.io-client');

console.log('🔍 Testing Socket.IO connection to: https://afoxlys.onrender.com\n');

const socket = io('https://afoxlys.onrender.com', {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ Socket.IO connected successfully!');
  console.log('   Socket ID:', socket.id);
  console.log('   Transport:', socket.io.engine.transport.name);
  console.log('   Connected:', socket.connected);
  
  // Test a simple emit
  socket.emit('test', { message: 'Hello from test script' });
  console.log('   Emitted test message');
  
  setTimeout(() => {
    console.log('   Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 3000);
});

socket.on('connect_error', (error) => {
  console.log('❌ Socket.IO connection failed!');
  console.log('   Error:', error.message);
  console.log('   Error type:', error.type);
  console.log('   Description:', error.description);
  console.log('   Context:', error.context);
  process.exit(1);
});

socket.on('error', (error) => {
  console.log('❌ Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('🔍 Socket disconnected:', reason);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.log('❌ Test timeout after 15 seconds');
  socket.disconnect();
  process.exit(1);
}, 15000); 