const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('./models/Post');
const User = require('./models/User');

async function testDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if there are any posts
    const postCount = await Post.countDocuments();
    console.log(`📊 Total posts in database: ${postCount}`);

    if (postCount > 0) {
      const posts = await Post.find().limit(3).populate('author', 'username firstName lastName');
      console.log('📝 Sample posts:', posts.map(p => ({
        id: p._id,
        content: p.content.substring(0, 50) + '...',
        author: p.author ? p.author.username : 'Unknown',
        isPrivate: p.isPrivate
      })));
    }

    // Check if there are any users
    const userCount = await User.countDocuments();
    console.log(`👥 Total users in database: ${userCount}`);

    if (userCount > 0) {
      const users = await User.find().limit(3).select('username firstName lastName following');
      console.log('👤 Sample users:', users.map(u => ({
        username: u.username,
        following: u.following ? u.following.length : 0
      })));
    }

    // Test the feed query logic
    console.log('\n🧪 Testing feed query logic...');
    let query = { isPrivate: false };
    console.log('Query for non-authenticated user:', JSON.stringify(query, null, 2));
    
    const publicPosts = await Post.find(query).countDocuments();
    console.log(`📊 Public posts: ${publicPosts}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testDatabase(); 