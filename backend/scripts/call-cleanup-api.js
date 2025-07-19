const axios = require('axios');

async function callCleanupAPI() {
  try {
    console.log('🔍 Calling cleanup API...');
    
    // You'll need to get a valid JWT token from a logged-in user
    // For now, we'll try without authentication first
    const API_BASE_URL = 'http://localhost:5000/api';
    
    console.log(`📡 Using API: ${API_BASE_URL}`);
    
    const response = await axios.delete(`${API_BASE_URL}/users/cleanup/test-users`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Cleanup completed successfully!');
    console.log('Response:', response.data);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 You need to be authenticated to run this cleanup.');
      console.log('Please:');
      console.log('1. Start the backend server');
      console.log('2. Log in to get a JWT token');
      console.log('3. Add the token to the Authorization header');
    }
  }
}

// Run the script
callCleanupAPI(); 