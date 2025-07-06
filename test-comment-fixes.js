const axios = require('axios');

const API_BASE_URL = 'https://afoxlys.onrender.com/api';
// Replace this with a valid JWT token for a user in your system
const TEST_JWT = 'REPLACE_WITH_A_VALID_JWT_TOKEN';

async function addTestComment(postId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/comments/post/${postId}`,
      { content: 'This is a test comment from script.' },
      { headers: { Authorization: `Bearer ${TEST_JWT}` } }
    );
    console.log('Test comment added:', response.data);
  } catch (error) {
    console.error('Error adding test comment:', error.response ? error.response.data : error.message);
  }
}

async function testCommentCount() {
  try {
    console.log('Testing comment count fixes...');
    // Get the feed
    const feedResponse = await axios.get(`${API_BASE_URL}/posts/feed`);
    if (feedResponse.data.posts && feedResponse.data.posts.length > 0) {
      const firstPost = feedResponse.data.posts[0];
      console.log('First post ID:', firstPost._id);
      // Add a test comment
      await addTestComment(firstPost._id);
      // Fetch comments for this post
      const commentsResponse = await axios.get(`${API_BASE_URL}/comments/post/${firstPost._id}`);
      console.log('Comments after adding test:', commentsResponse.data.comments);
      console.log('Comments count:', commentsResponse.data.comments.length);
    } else {
      console.log('No posts found in feed');
    }
  } catch (error) {
    console.error('Test error:', error.response ? error.response.data : error.message);
  }
}

testCommentCount(); 