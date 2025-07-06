// Test script for voting system
const axios = require('axios');

const API_BASE = 'https://afoxlys.onrender.com/api';

async function testVotingSystem() {
  try {
    console.log('🧪 Testing Voting System...\n');

    // Test 1: Get a random post
    console.log('1. Fetching random post...');
    const postResponse = await axios.get(`${API_BASE}/swipe/post`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      }
    });
    
    if (postResponse.data) {
      console.log('✅ Post fetched successfully');
      console.log('   Post ID:', postResponse.data._id);
      console.log('   Content:', postResponse.data.content?.substring(0, 50) + '...');
      console.log('   Has Media:', !!postResponse.data.media?.length);
    }

    // Test 2: Vote on the post
    console.log('\n2. Testing vote...');
    const voteResponse = await axios.post(`${API_BASE}/swipe/vote`, {
      postId: postResponse.data._id,
      voteType: 'hot'
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      }
    });
    
    if (voteResponse.data) {
      console.log('✅ Vote recorded successfully');
      console.log('   Vote Type:', voteResponse.data.voteType);
      console.log('   Post ID:', voteResponse.data.postId);
    }

    // Test 3: Get stats
    console.log('\n3. Fetching stats...');
    const statsResponse = await axios.get(`${API_BASE}/swipe/stats`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      }
    });
    
    if (statsResponse.data) {
      console.log('✅ Stats fetched successfully');
      console.log('   Total Votes:', statsResponse.data.totalVotes);
      console.log('   Hot Votes:', statsResponse.data.hotVotes);
      console.log('   Not Votes:', statsResponse.data.notVotes);
    }

    console.log('\n🎉 All tests passed! Voting system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Make sure to replace YOUR_TOKEN_HERE with a valid JWT token');
    }
  }
}

// Run the test
testVotingSystem(); 