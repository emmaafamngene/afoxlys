const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
let authToken = null;

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

async function testPremiumAPI() {
  console.log('🚀 Testing Premium API Endpoints...\n');

  try {
    // Step 1: Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      emailOrUsername: testUser.email,
      password: testUser.password
    });
    
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('User:', loginResponse.data.user.username);
    console.log('Email:', loginResponse.data.user.email);
    console.log('Is Premium:', loginResponse.data.user.isPremium);

    // Step 2: Check premium status
    console.log('\n2️⃣ Checking premium status...');
    const statusResponse = await axios.get(`${API_BASE_URL}/payments/premium/status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Premium status retrieved');
    console.log('Status:', statusResponse.data);

    // Step 3: Initialize premium payment (development mode)
    console.log('\n3️⃣ Initializing premium payment...');
    const initResponse = await axios.post(`${API_BASE_URL}/payments/premium/initialize`, {
      email: testUser.email,
      plan: 'monthly'
    }, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Payment initialization successful');
    console.log('Response:', initResponse.data);

    // Step 4: Verify payment (development mode)
    if (initResponse.data.reference && initResponse.data.reference.startsWith('dev_ref_')) {
      console.log('\n4️⃣ Verifying development payment...');
      const verifyResponse = await axios.post(`${API_BASE_URL}/payments/premium/verify`, {
        reference: initResponse.data.reference,
        email: testUser.email
      }, {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Payment verification successful');
      console.log('Response:', verifyResponse.data);
    }

    // Step 5: Check premium status again
    console.log('\n5️⃣ Checking premium status after activation...');
    const finalStatusResponse = await axios.get(`${API_BASE_URL}/payments/premium/status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Final premium status');
    console.log('Status:', finalStatusResponse.data);

    console.log('\n🎉 All premium API tests completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Try creating a test user first or check your credentials');
    }
  }
}

// Test with test activation endpoint
async function testPremiumActivation() {
  console.log('\n🔧 Testing Premium Activation Endpoint...\n');

  try {
    if (!authToken) {
      console.log('❌ No auth token available. Run the main test first.');
      return;
    }

    console.log('1️⃣ Activating premium via test endpoint...');
    const activationResponse = await axios.post(`${API_BASE_URL}/payments/premium/activate-test`, {
      plan: 'monthly'
    }, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Premium activation successful');
    console.log('Response:', activationResponse.data);

  } catch (error) {
    console.error('❌ Activation error:', error.response?.data || error.message);
  }
}

// Run tests
async function runAllTests() {
  await testPremiumAPI();
  await testPremiumActivation();
}

// Check if running directly
if (require.main === module) {
  runAllTests();
}

module.exports = { testPremiumAPI, testPremiumActivation }; 