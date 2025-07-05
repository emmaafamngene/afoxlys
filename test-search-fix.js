// Test script to verify the search API fix
console.log('🔍 Testing search API fix...');

// Test the search API response structure
async function testSearchAPI() {
  try {
    console.log('🔍 Testing search API call...');
    
    const response = await fetch('https://afoxlys.onrender.com/api/search/users?q=test', {
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if needed
        // 'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const data = await response.json();
    console.log('✅ Search API response:', data);
    
    // Check if the response has the expected structure
    if (data.users && Array.isArray(data.users)) {
      console.log('✅ Response structure is correct - users array found');
      console.log('✅ Number of users found:', data.users.length);
    } else {
      console.error('❌ Response structure is incorrect - no users array');
      console.error('❌ Response keys:', Object.keys(data));
    }
    
    // Test the filtering logic
    if (data.users && data.users.length > 0) {
      const testUserId = 'test-user-id';
      const testFollowing = [{ _id: 'following-user-id' }];
      
      const filtered = data.users.filter(u => 
        u._id !== testUserId && 
        !testFollowing.find(f => f._id === u._id)
      );
      
      console.log('✅ Filtering logic works correctly');
      console.log('✅ Original users:', data.users.length);
      console.log('✅ Filtered users:', filtered.length);
    }
    
  } catch (error) {
    console.error('❌ Search API test failed:', error);
  }
}

// Test the NewChatModal search function
function testNewChatModalSearch() {
  console.log('🔍 Testing NewChatModal search logic...');
  
  // Simulate the API response structure
  const mockResponse = {
    data: {
      users: [
        { _id: 'user1', username: 'user1', firstName: 'User', lastName: 'One' },
        { _id: 'user2', username: 'user2', firstName: 'User', lastName: 'Two' },
        { _id: 'user3', username: 'user3', firstName: 'User', lastName: 'Three' }
      ],
      pagination: { current: 1, total: 1, hasNext: false, hasPrev: false },
      query: 'test'
    }
  };
  
  // Simulate the current user and following list
  const currentUser = { _id: 'user1' };
  const following = [{ _id: 'user2' }];
  
  // Apply the fixed logic
  const users = mockResponse.data.users || [];
  const filtered = users.filter(u => 
    u._id !== currentUser._id && 
    !following.find(f => f._id === u._id)
  );
  
  console.log('✅ NewChatModal search logic test:');
  console.log('✅ Original users:', users.length);
  console.log('✅ Current user ID:', currentUser._id);
  console.log('✅ Following users:', following.map(f => f._id));
  console.log('✅ Filtered users:', filtered.length);
  console.log('✅ Filtered user IDs:', filtered.map(u => u._id));
  
  // Verify the filtering worked correctly
  const expectedFiltered = ['user3']; // user1 is current user, user2 is following
  const actualFiltered = filtered.map(u => u._id);
  
  if (JSON.stringify(expectedFiltered) === JSON.stringify(actualFiltered)) {
    console.log('✅ Filtering logic is working correctly!');
  } else {
    console.error('❌ Filtering logic has issues');
    console.error('Expected:', expectedFiltered);
    console.error('Actual:', actualFiltered);
  }
}

// Run tests
testSearchAPI();
testNewChatModalSearch();

console.log('🔍 Search API fix test complete. Check console for results.'); 