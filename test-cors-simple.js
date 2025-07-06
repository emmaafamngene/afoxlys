// Simple CORS test
const axios = require('axios');

const API_BASE = 'https://afoxlys.onrender.com/api';

async function testCORSHeaders() {
  try {
    console.log('🧪 Testing CORS Headers...\n');

    // Test 1: Simple GET request to cors-test endpoint
    console.log('1. Testing GET request to /api/cors-test...');
    const response = await axios.get(`${API_BASE}/cors-test`, {
      headers: {
        'Origin': 'https://afoxly.netlify.app'
      }
    });
    
    console.log('✅ Response received');
    console.log('   Status:', response.status);
    console.log('   Data:', response.data);
    console.log('   CORS Headers:');
    console.log('     Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    console.log('     Access-Control-Allow-Methods:', response.headers['access-control-allow-methods']);
    console.log('     Access-Control-Allow-Headers:', response.headers['access-control-allow-headers']);
    console.log('     Access-Control-Allow-Credentials:', response.headers['access-control-allow-credentials']);

    // Test 2: OPTIONS request to auth/login
    console.log('\n2. Testing OPTIONS request to /api/auth/login...');
    const optionsResponse = await axios.options(`${API_BASE}/auth/login`, {
      headers: {
        'Origin': 'https://afoxly.netlify.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('✅ OPTIONS response received');
    console.log('   Status:', optionsResponse.status);
    console.log('   CORS Headers:');
    console.log('     Access-Control-Allow-Origin:', optionsResponse.headers['access-control-allow-origin']);
    console.log('     Access-Control-Allow-Methods:', optionsResponse.headers['access-control-allow-methods']);
    console.log('     Access-Control-Allow-Headers:', optionsResponse.headers['access-control-allow-headers']);
    console.log('     Access-Control-Allow-Credentials:', optionsResponse.headers['access-control-allow-credentials']);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('   Status:', error.response?.status);
    console.error('   Headers:', JSON.stringify(error.response?.headers, null, 2));
  }
}

// Run the test
testCORSHeaders(); 