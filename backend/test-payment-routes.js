const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testPaymentRoutes() {
  console.log('🧪 Testing Payment Routes...\n');

  try {
    // Test 1: Get supported payment methods
    console.log('1. Testing GET /payments/supported-methods');
    try {
      const response = await axios.get(`${BASE_URL}/payments/supported-methods`);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 2: Get fundraising stats
    console.log('\n2. Testing GET /clips/fundraising-stats');
    try {
      const response = await axios.get(`${BASE_URL}/clips/fundraising-stats`);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 3: Test donation creation
    console.log('\n3. Testing POST /clips/donations');
    try {
      const response = await axios.post(`${BASE_URL}/clips/donations`, {
        amount: 10,
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test donation'
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 4: Test payment intent creation
    console.log('\n4. Testing POST /payments/create-payment-intent');
    try {
      const response = await axios.post(`${BASE_URL}/payments/create-payment-intent`, {
        amount: 25,
        currency: 'USD',
        customer: {
          name: 'Test Customer',
          email: 'customer@example.com'
        },
        paymentMethod: 'moniepoint',
        isDonation: true
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 5: Test health check
    console.log('\n5. Testing GET /health');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testPaymentRoutes(); 