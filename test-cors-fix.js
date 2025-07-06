// Test script for CORS configuration
const axios = require('axios');

const API_BASE = 'https://afoxlys.onrender.com/api';

async function testCORSConfiguration() {
  try {
    console.log('🧪 Testing CORS Configuration...\n');

    // Test 1: Test OPTIONS preflight request
    console.log('1. Testing OPTIONS preflight request...');
    const optionsResponse = await axios.options(`${API_BASE}/auth/login`, {
      headers: {
        'Origin': 'https://afoxly.netlify.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('✅ OPTIONS request successful');
    console.log('   Status:', optionsResponse.status);
    console.log('   Access-Control-Allow-Origin:', optionsResponse.headers['access-control-allow-origin']);
    console.log('   Access-Control-Allow-Methods:', optionsResponse.headers['access-control-allow-methods']);
    console.log('   Access-Control-Allow-Headers:', optionsResponse.headers['access-control-allow-headers']);

    // Test 2: Test actual POST request
    console.log('\n2. Testing POST request...');
    const postResponse = await axios.post(`${API_BASE}/auth/login`, {
      emailOrUsername: 'test@example.com',
      password: 'testpassword'
    }, {
      headers: {
        'Origin': 'https://afoxly.netlify.app',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ POST request successful');
    console.log('   Status:', postResponse.status);
    console.log('   Access-Control-Allow-Origin:', postResponse.headers['access-control-allow-origin']);

    // Test 3: Test register endpoint
    console.log('\n3. Testing register endpoint...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword',
      firstName: 'Test',
      lastName: 'User'
    }, {
      headers: {
        'Origin': 'https://afoxly.netlify.app',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Register request successful');
    console.log('   Status:', registerResponse.status);
    console.log('   Access-Control-Allow-Origin:', registerResponse.headers['access-control-allow-origin']);

    console.log('\n🎉 CORS configuration is working correctly!');

  } catch (error) {
    console.error('❌ CORS test failed:', error.response?.data || error.message);
    console.error('   Status:', error.response?.status);
    console.error('   Headers:', error.response?.headers);
    
    if (error.response?.status === 401) {
      console.log('\n💡 This is expected for login/register without valid credentials');
    }
  }
}

// Run the test
testCORSConfiguration(); 