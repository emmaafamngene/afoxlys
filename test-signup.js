const axios = require('axios');

const API_BASE_URL = 'https://afoxlys.onrender.com/api';

async function testSignup() {
  try {
    console.log('Testing signup functionality...');
    
    const signupData = {
      username: 'testuser' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };
    
    console.log('Signup data:', signupData);
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, signupData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Signup successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Signup failed!');
    console.error('Error status:', error.response?.status);
    console.error('Error message:', error.response?.data);
    console.error('Full error:', error.message);
  }
}

async function testHealthCheck() {
  try {
    console.log('Testing health check...');
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check successful:', response.data);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

async function runTests() {
  console.log('=== AFEX Signup Debug Test ===\n');
  
  await testHealthCheck();
  console.log('\n---\n');
  await testSignup();
}

runTests(); 