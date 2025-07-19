const axios = require('axios');

async function cleanupProduction() {
  try {
    console.log('🔍 Starting production cleanup...');
    
    // Use the production API endpoint
    const API_BASE_URL = 'https://afoxlys.onrender.com/api';
    
    console.log(`📡 Using production API: ${API_BASE_URL}`);
    
    // First, let's try to get all users to see what we're working with
    console.log('🔍 Fetching users from production...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      const users = response.data.users || response.data;
      
      console.log(`✅ Found ${users.length} total users in production`);
      
      // Filter test users
      const testUsers = users.filter(user => {
        const username = user.username?.toLowerCase() || '';
        return username.startsWith('emmanuel') || 
               username.startsWith('onyekachi') || 
               username.startsWith('test');
      });
      
      console.log(`🔍 Found ${testUsers.length} test users to remove:`);
      testUsers.forEach(user => {
        console.log(`  - ${user.username} (${user.email})`);
      });
      
      if (testUsers.length === 0) {
        console.log('✅ No test users found in production');
        return;
      }
      
      // Try to call the cleanup endpoint
      console.log('\n🗑️  Attempting to call cleanup endpoint...');
      
      try {
        const cleanupResponse = await axios.delete(`${API_BASE_URL}/users/cleanup/test-users`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Cleanup completed successfully!');
        console.log('Response:', cleanupResponse.data);
        
      } catch (cleanupError) {
        console.log('❌ Cleanup endpoint failed:', cleanupError.response?.data || cleanupError.message);
        console.log('\n💡 The cleanup endpoint requires authentication.');
        console.log('You may need to:');
        console.log('1. Log in to get a JWT token');
        console.log('2. Add the token to the Authorization header');
        console.log('3. Or contact the admin to run the cleanup');
      }
      
    } catch (error) {
      console.error('❌ Error fetching users:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

// Run the script
cleanupProduction(); 