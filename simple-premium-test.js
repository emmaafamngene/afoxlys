const mongoose = require('mongoose');
require('dotenv').config();

console.log('🚀 Starting simple premium test...');

async function simpleTest() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Import User model
    const User = require('./backend/models/User');
    console.log('✅ User model loaded');

    // Create a test user
    console.log('👤 Creating test user...');
    const testUser = new User({
      username: 'simpletest',
      email: 'simple-test@example.com',
      password: 'password123',
      firstName: 'Simple',
      lastName: 'Test'
    });
    await testUser.save();
    console.log('✅ Test user created');

    // Test premium activation
    console.log('⭐ Testing premium activation...');
    await testUser.activatePremium('monthly', 30);
    console.log('✅ Premium activated');
    console.log('Is Premium:', testUser.isPremium);
    console.log('Is Premium Active:', testUser.isPremiumActive());
    console.log('Days Until Expiry:', testUser.getDaysUntilExpiry());

    // Clean up
    console.log('🧹 Cleaning up...');
    await User.deleteOne({ email: 'simple-test@example.com' });
    console.log('✅ Test user deleted');

    console.log('🎉 Simple test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

simpleTest(); 