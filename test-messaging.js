const axios = require('axios');

const API_BASE_URL = 'https://afoxlys.onrender.com/api';

// Test user credentials (you'll need to replace these with actual user IDs)
const USER1_ID = 'YOUR_USER_ID_1'; // Replace with actual user ID
const USER2_ID = 'YOUR_USER_ID_2'; // Replace with actual user ID
const USER1_TOKEN = 'YOUR_USER1_TOKEN'; // Replace with actual token
const USER2_TOKEN = 'YOUR_USER2_TOKEN'; // Replace with actual token

async function testMessaging() {
  try {
    console.log('=== Testing AFEX Messaging System ===\n');
    
    // Test 1: Get conversations for user 1
    console.log('1. Testing get conversations for user 1...');
    const conversationsResponse = await axios.get(`${API_BASE_URL}/chat/conversations/${USER1_ID}`, {
      headers: { Authorization: `Bearer ${USER1_TOKEN}` }
    });
    console.log('✅ Conversations:', conversationsResponse.data);
    
    // Test 2: Create a conversation between users
    console.log('\n2. Testing create conversation...');
    const conversationResponse = await axios.post(`${API_BASE_URL}/chat/conversations`, {
      userId1: USER1_ID,
      userId2: USER2_ID
    }, {
      headers: { Authorization: `Bearer ${USER1_TOKEN}` }
    });
    console.log('✅ Conversation created:', conversationResponse.data);
    
    const conversationId = conversationResponse.data._id;
    
    // Test 3: Send a message via API
    console.log('\n3. Testing send message via API...');
    const messageResponse = await axios.post(`${API_BASE_URL}/chat/messages`, {
      conversationId: conversationId,
      sender: USER1_ID,
      recipient: USER2_ID,
      content: 'Hello from user 1!'
    }, {
      headers: { Authorization: `Bearer ${USER1_TOKEN}` }
    });
    console.log('✅ Message sent:', messageResponse.data);
    
    // Test 4: Get messages for the conversation
    console.log('\n4. Testing get messages...');
    const messagesResponse = await axios.get(`${API_BASE_URL}/chat/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${USER1_TOKEN}` }
    });
    console.log('✅ Messages:', messagesResponse.data);
    
    // Test 5: Test with user 2 token
    console.log('\n5. Testing get messages with user 2...');
    const messagesResponse2 = await axios.get(`${API_BASE_URL}/chat/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${USER2_TOKEN}` }
    });
    console.log('✅ Messages for user 2:', messagesResponse2.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

async function testSocketConnection() {
  console.log('\n=== Testing Socket.IO Connection ===\n');
  
  try {
    const io = require('socket.io-client');
    const socket = io('https://afoxlys.onrender.com');
    
    socket.on('connect', () => {
      console.log('✅ Socket connected with ID:', socket.id);
      
      // Join as user 1
      socket.emit('join', USER1_ID);
      console.log('🔍 Joined as user:', USER1_ID);
      
      // Test sending a message
      setTimeout(() => {
        const testMessage = {
          conversationId: 'TEST_CONVERSATION_ID', // You'll need a real conversation ID
          sender: USER1_ID,
          recipient: USER2_ID,
          content: 'Test message via socket'
        };
        
        console.log('🔍 Sending test message:', testMessage);
        socket.emit('send_message', testMessage);
      }, 2000);
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });
    
    socket.on('receive_message', (message) => {
      console.log('✅ Received message:', message);
    });
    
    socket.on('delivered', (data) => {
      console.log('✅ Message delivered:', data);
    });
    
    // Keep connection alive for 10 seconds
    setTimeout(() => {
      console.log('🔍 Disconnecting socket...');
      socket.disconnect();
    }, 10000);
    
  } catch (error) {
    console.error('❌ Socket test failed:', error.message);
  }
}

// Instructions for running the test
console.log('=== AFEX Messaging Debug Test ===\n');
console.log('To run this test, you need to:');
console.log('1. Replace USER1_ID and USER2_ID with actual user IDs');
console.log('2. Replace USER1_TOKEN and USER2_TOKEN with actual JWT tokens');
console.log('3. Install socket.io-client: npm install socket.io-client');
console.log('4. Run: node test-messaging.js\n');

// Uncomment the lines below after setting up the credentials
// testMessaging();
// testSocketConnection(); 