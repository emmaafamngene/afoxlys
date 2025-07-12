const axios = require('axios');

const BASE_URL = 'https://afoxlys.onrender.com/api';

// Test the upload endpoint
const testUploadEndpoint = async () => {
  console.log('🔍 Testing upload endpoint...');
  
  try {
    // Test GET endpoint (no auth required)
    const getResponse = await axios.get(`${BASE_URL}/upload/upload-to-cloudinary`);
    console.log('✅ GET upload endpoint response:', getResponse.data);
    
    // Test POST endpoint (auth required)
    const postResponse = await axios.post(`${BASE_URL}/upload/upload-to-cloudinary`);
    console.log('✅ POST upload endpoint accessible (auth required)');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ POST upload endpoint requires auth (expected)');
    } else {
      console.error('❌ Upload endpoint test failed:', error.response?.data || error.message);
    }
  }
};

// Test shorts endpoint
const testShortsEndpoint = async () => {
  console.log('\n📱 Testing shorts endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/shorts`);
    console.log('✅ Shorts endpoint response:', response.data);
  } catch (error) {
    console.error('❌ Shorts endpoint test failed:', error.response?.data || error.message);
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Upload Tests...\n');
  
  await testUploadEndpoint();
  await testShortsEndpoint();
  
  console.log('\n🎉 Tests completed!');
};

runTests().catch(console.error); 