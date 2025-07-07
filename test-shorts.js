const mongoose = require('mongoose');
require('dotenv').config();

const Short = require('./backend/models/Short');
const User = require('./backend/models/User');

async function testShorts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if Shorts model exists
    console.log('📋 Testing Shorts model...');
    
    // Create a test user if none exists
    let testUser = await User.findOne();
    if (!testUser) {
      console.log('👤 Creating test user...');
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });
      await testUser.save();
      console.log('✅ Test user created');
    }

    // Create a test short
    console.log('📱 Creating test short...');
    const testShort = new Short({
      author: testUser._id,
      caption: 'This is a test short! 🎬',
      mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      type: 'image'
    });
    await testShort.save();
    console.log('✅ Test short created');

    // Test fetching shorts
    console.log('📥 Testing fetch shorts...');
    const shorts = await Short.find()
      .populate('author', 'username firstName lastName avatar')
      .sort({ createdAt: -1 });
    console.log(`✅ Found ${shorts.length} shorts`);

    // Test like functionality
    console.log('❤️ Testing like functionality...');
    testShort.likes.push(testUser._id);
    await testShort.save();
    console.log(`✅ Short has ${testShort.likes.length} likes`);

    // Test comment functionality
    console.log('💬 Testing comment functionality...');
    testShort.comments.push({
      author: testUser._id,
      content: 'This is a test comment! 🎉'
    });
    await testShort.save();
    console.log(`✅ Short has ${testShort.comments.length} comments`);

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await Short.findByIdAndDelete(testShort._id);
    console.log('✅ Test short deleted');

    console.log('\n🎉 All Shorts tests passed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testShorts(); 