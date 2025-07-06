// Test script for the leveling system
const axios = require('axios');

const API_BASE = 'https://afoxlys.onrender.com/api';

async function testLevelingSystem() {
  try {
    console.log('🧪 Testing Leveling System...\n');

    // Test 1: Register a new user
    console.log('1. Registering new user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      username: 'testleveler',
      email: 'testleveler@example.com',
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'Leveler'
    });
    
    if (registerResponse.data) {
      console.log('✅ User registered successfully');
      console.log('   User ID:', registerResponse.data.user._id);
      console.log('   Initial Level:', registerResponse.data.user.level);
      console.log('   Initial XP:', registerResponse.data.user.xp);
    }

    const token = registerResponse.data.token;
    const userId = registerResponse.data.user._id;

    // Test 2: Create a post (should award 10 XP)
    console.log('\n2. Creating a post...');
    const postResponse = await axios.post(`${API_BASE}/posts`, {
      content: 'This is a test post for XP!'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (postResponse.data) {
      console.log('✅ Post created successfully');
      console.log('   Post ID:', postResponse.data.post._id);
      
      // Check if XP info is in response
      if (postResponse.data.xpInfo) {
        console.log('   XP Gained:', postResponse.data.xpInfo.xpGained);
        console.log('   Total XP:', postResponse.data.xpInfo.totalXP);
        console.log('   Current Level:', postResponse.data.xpInfo.currentLevel);
        console.log('   Progress:', postResponse.data.xpInfo.progress.toFixed(1) + '%');
      }
    }

    // Test 3: Get user profile to check updated XP
    console.log('\n3. Checking updated user profile...');
    const profileResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (profileResponse.data) {
      console.log('✅ Profile fetched successfully');
      console.log('   Current Level:', profileResponse.data.user.level);
      console.log('   Current XP:', profileResponse.data.user.xp);
      console.log('   Progress to next level:', profileResponse.data.user.progress.toFixed(1) + '%');
      console.log('   XP for next level:', profileResponse.data.user.xpForNextLevel);
      console.log('   Login Streak:', profileResponse.data.user.loginStreak);
    }

    // Test 4: Test leaderboard
    console.log('\n4. Testing leaderboard...');
    const leaderboardResponse = await axios.get(`${API_BASE}/leaderboard?limit=5`);
    
    if (leaderboardResponse.data) {
      console.log('✅ Leaderboard fetched successfully');
      console.log('   Total users:', leaderboardResponse.data.pagination.total);
      console.log('   Top 3 users:');
      leaderboardResponse.data.users.slice(0, 3).forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.displayName} - Level ${user.level} (${user.xp} XP)`);
      });
    }

    // Test 5: Test user's rank
    console.log('\n5. Testing user rank...');
    const rankResponse = await axios.get(`${API_BASE}/leaderboard/user/${userId}`);
    
    if (rankResponse.data) {
      console.log('✅ User rank fetched successfully');
      console.log('   User Rank:', rankResponse.data.user.rank);
      console.log('   User Level:', rankResponse.data.user.level);
      console.log('   User XP:', rankResponse.data.user.xp);
    }

    console.log('\n🎉 All leveling system tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Make sure to replace YOUR_TOKEN_HERE with a valid JWT token');
    }
  }
}

// Run the test
testLevelingSystem(); 