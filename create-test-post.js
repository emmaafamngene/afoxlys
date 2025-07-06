const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('./models/Post');
const User = require('./models/User');

async function createTestPost() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if there are any users
    const userCount = await User.countDocuments();
    console.log(`👥 Total users: ${userCount}`);

    if (userCount === 0) {
      console.log('❌ No users found. Cannot create post without a user.');
      return;
    }

    // Get the first user
    const user = await User.findOne().select('_id username');
    console.log(`👤 Using user: ${user.username} (${user._id})`);

    // Check if there are any posts
    const postCount = await Post.countDocuments();
    console.log(`📊 Current posts: ${postCount}`);

    // Create a test post
    const testPost = new Post({
      author: user._id,
      content: 'This is a test post to verify the feed is working! 🎉',
      tags: ['test', 'feed'],
      isPrivate: false,
    });

    await testPost.save();
    console.log('✅ Test post created:', testPost._id);

    // Verify the post was created
    const newPostCount = await Post.countDocuments();
    console.log(`📊 Posts after creation: ${newPostCount}`);

    // Test the feed query
    const feedPosts = await Post.find({ isPrivate: false })
      .populate('author', 'username firstName lastName avatar')
      .sort({ createdAt: -1 });

    console.log(`📝 Feed posts found: ${feedPosts.length}`);
    if (feedPosts.length > 0) {
      console.log('📋 Latest post:', {
        id: feedPosts[0]._id,
        content: feedPosts[0].content,
        author: feedPosts[0].author?.username || 'Unknown',
        isPrivate: feedPosts[0].isPrivate
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestPost(); 