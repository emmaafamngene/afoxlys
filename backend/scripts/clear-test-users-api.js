const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';

async function clearTestUsers() {
  try {
    console.log('🔍 Starting API-based user cleanup...');
    console.log(`📡 Using API: ${API_BASE_URL}`);

    // First, let's try to get all users (this might require admin access)
    console.log('🔍 Fetching users...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      const users = response.data;
      console.log(`✅ Found ${users.length} total users`);

      // Filter users with usernames starting with emmanuel, onyekachi, or test
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
        console.log('✅ No test users found');
        return;
      }

      // Delete each test user
      console.log('\n🗑️  Deleting test users...');
      let deletedCount = 0;

      for (const user of testUsers) {
        try {
          await axios.delete(`${API_BASE_URL}/users/${user._id}`, {
            headers: {
              'Authorization': `Bearer ${ADMIN_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`✅ Deleted: ${user.username}`);
          deletedCount++;
        } catch (error) {
          console.log(`❌ Failed to delete ${user.username}: ${error.response?.data?.message || error.message}`);
        }
      }

      console.log(`\n✅ Successfully deleted ${deletedCount} out of ${testUsers.length} test users`);

    } catch (error) {
      console.error('❌ Error accessing API:', error.response?.data || error.message);
      console.log('\n💡 Alternative approach: You may need to:');
      console.log('1. Set up admin authentication');
      console.log('2. Use the correct API endpoint');
      console.log('3. Or run this script with proper database access');
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

// Run the script
clearTestUsers(); 