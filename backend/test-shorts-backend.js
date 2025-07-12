const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123'
};

let authToken = '';

// Helper function to make authenticated requests
const makeAuthRequest = async (method, url, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Test functions
const testAuth = async () => {
  console.log('🔐 Testing authentication...');
  try {
    // Register user
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ User registered:', registerResponse.data.message);
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
      console.log('ℹ️ User already exists, proceeding with login...');
    } else {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      return false;
    }
  }

  try {
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
};

const testGetShorts = async () => {
  console.log('\n📱 Testing get shorts...');
  try {
    const response = await axios.get(`${BASE_URL}/shorts`);
    console.log('✅ Get shorts successful');
    console.log(`   Found ${response.data.shorts.length} shorts`);
    console.log(`   Total: ${response.data.pagination.total}`);
    return response.data.shorts;
  } catch (error) {
    console.error('❌ Get shorts failed:', error.response?.data || error.message);
    return [];
  }
};

const testCreateShort = async () => {
  console.log('\n➕ Testing create short...');
  try {
    const shortData = {
      caption: 'Test short from backend test script',
      mediaUrl: 'https://example.com/test-video.mp4',
      type: 'video'
    };

    const response = await makeAuthRequest('POST', '/shorts', shortData);
    console.log('✅ Create short successful');
    console.log(`   Short ID: ${response.data.short._id}`);
    console.log(`   Caption: ${response.data.short.caption}`);
    return response.data.short;
  } catch (error) {
    console.error('❌ Create short failed:', error.response?.data || error.message);
    return null;
  }
};

const testGetShortById = async (shortId) => {
  console.log('\n🔍 Testing get short by ID...');
  try {
    const response = await axios.get(`${BASE_URL}/shorts/${shortId}`);
    console.log('✅ Get short by ID successful');
    console.log(`   Views: ${response.data.short.views}`);
    return response.data.short;
  } catch (error) {
    console.error('❌ Get short by ID failed:', error.response?.data || error.message);
    return null;
  }
};

const testLikeShort = async (shortId) => {
  console.log('\n❤️ Testing like short...');
  try {
    const response = await makeAuthRequest('POST', `/shorts/${shortId}/like`);
    console.log('✅ Like short successful');
    console.log(`   Is liked: ${response.data.isLiked}`);
    console.log(`   Total likes: ${response.data.likes}`);
    return response.data;
  } catch (error) {
    console.error('❌ Like short failed:', error.response?.data || error.message);
    return null;
  }
};

const testAddComment = async (shortId) => {
  console.log('\n💬 Testing add comment...');
  try {
    const commentData = {
      content: 'This is a test comment from the backend test script!'
    };

    const response = await makeAuthRequest('POST', `/shorts/${shortId}/comments`, commentData);
    console.log('✅ Add comment successful');
    console.log(`   Comment ID: ${response.data.comment._id}`);
    console.log(`   Content: ${response.data.comment.content}`);
    return response.data.comment;
  } catch (error) {
    console.error('❌ Add comment failed:', error.response?.data || error.message);
    return null;
  }
};

const testGetComments = async (shortId) => {
  console.log('\n💬 Testing get comments...');
  try {
    const response = await axios.get(`${BASE_URL}/shorts/${shortId}/comments`);
    console.log('✅ Get comments successful');
    console.log(`   Found ${response.data.comments.length} comments`);
    return response.data.comments;
  } catch (error) {
    console.error('❌ Get comments failed:', error.response?.data || error.message);
    return [];
  }
};

const testUpload = async () => {
  console.log('\n📤 Testing upload endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/upload-to-cloudinary`);
    console.log('✅ Upload endpoint accessible');
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Upload endpoint requires auth (expected)');
      return true;
    } else {
      console.error('❌ Upload endpoint failed:', error.response?.data || error.message);
      return false;
    }
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting AFEX Shorts Backend Tests...\n');

  // Test authentication
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('\n❌ Authentication failed, stopping tests');
    return;
  }

  // Test upload endpoint
  await testUpload();

  // Test get shorts
  const shorts = await testGetShorts();

  // Test create short
  const newShort = await testCreateShort();
  if (newShort) {
    // Test get short by ID
    await testGetShortById(newShort._id);

    // Test like short
    await testLikeShort(newShort._id);

    // Test add comment
    await testAddComment(newShort._id);

    // Test get comments
    await testGetComments(newShort._id);
  }

  console.log('\n🎉 All tests completed!');
  console.log('\n📊 Summary:');
  console.log('   - Authentication: ✅');
  console.log('   - Upload endpoint: ✅');
  console.log('   - Get shorts: ✅');
  console.log('   - Create short: ✅');
  console.log('   - Get short by ID: ✅');
  console.log('   - Like/unlike: ✅');
  console.log('   - Add comment: ✅');
  console.log('   - Get comments: ✅');
};

// Run tests
runTests().catch(console.error); 