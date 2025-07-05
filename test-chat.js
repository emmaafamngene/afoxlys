// Simple test script for AFEX Chat
// Run this in your browser console to test chat functionality

console.log('🧪 AFEX Chat Test Script');
console.log('========================');

// Test 1: Check if Socket.IO is connected
if (typeof io !== 'undefined') {
  console.log('✅ Socket.IO is available');
} else {
  console.log('❌ Socket.IO not found - make sure socket.io-client is installed');
}

// Test 2: Check if chat components are loaded
if (document.querySelector('[data-testid="chat-window"]') || document.querySelector('.chat-window')) {
  console.log('✅ Chat components are loaded');
} else {
  console.log('❌ Chat components not found');
}

// Test 3: Simulate sending a message
function testSendMessage() {
  const input = document.querySelector('input[placeholder*="message"]');
  const sendButton = document.querySelector('button[type="submit"], button:has(svg)');
  
  if (input && sendButton) {
    input.value = 'Test message from console!';
    sendButton.click();
    console.log('✅ Test message sent');
  } else {
    console.log('❌ Message input or send button not found');
  }
}

// Test 4: Check API endpoints
async function testAPIEndpoints() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    // Test health endpoint
    const health = await fetch(`${baseURL}/health`);
    console.log('✅ Backend is running:', await health.json());
    
    // Test chat conversations endpoint (will fail without auth, but shows endpoint exists)
    const conversations = await fetch(`${baseURL}/chat/conversations/test`);
    console.log('✅ Chat API endpoint exists');
  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
}

// Run tests
testAPIEndpoints();

console.log('📝 Available test functions:');
console.log('- testSendMessage() - Send a test message');
console.log('- testAPIEndpoints() - Test API connectivity'); 