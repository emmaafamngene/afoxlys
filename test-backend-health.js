const axios = require('axios');

const BASE_URL = 'https://afoxlys.onrender.com';

async function testBackendHealth() {
  console.log('🔍 Testing Backend Health...\n');
  
  try {
    // Test 1: Health endpoint
    console.log('=== Test 1: Health Endpoint ===');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`, {
      timeout: 10000
    });
    console.log('✅ Health check passed!');
    console.log('   Status:', healthResponse.status);
    console.log('   Response:', healthResponse.data);
    
    // Test 2: Socket.IO endpoint
    console.log('\n=== Test 2: Socket.IO Endpoint ===');
    const socketResponse = await axios.get(`${BASE_URL}/socket.io/`, {
      timeout: 10000
    });
    console.log('✅ Socket.IO endpoint accessible!');
    console.log('   Status:', socketResponse.status);
    
    // Test 3: CORS headers
    console.log('\n=== Test 3: CORS Headers ===');
    const corsResponse = await axios.options(`${BASE_URL}/api/health`, {
      timeout: 10000
    });
    console.log('✅ CORS headers present!');
    console.log('   Access-Control-Allow-Origin:', corsResponse.headers['access-control-allow-origin']);
    console.log('   Access-Control-Allow-Methods:', corsResponse.headers['access-control-allow-methods']);
    
    console.log('\n✅ All backend tests passed!');
    return true;
    
  } catch (error) {
    console.log('❌ Backend test failed!');
    console.log('   Error:', error.message);
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
      console.log('   Headers:', error.response.headers);
    }
    
    return false;
  }
}

testBackendHealth(); 