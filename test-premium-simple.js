const mongoose = require('mongoose');
require('dotenv').config();

console.log('🚀 Testing Premium Functionality...');

async function testPremium() {
  try {
    // Connect to MongoDB
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
      username: 'premiumtest',
      email: 'premium@test.com',
      password: 'password123',
      firstName: 'Premium',
      lastName: 'Test'
    });
    await testUser.save();
    console.log('✅ Test user created');

    // Test initial state
    console.log('\n📊 Initial state:');
    console.log('Is Premium:', testUser.isPremium);
    console.log('Is Premium Active:', testUser.isPremiumActive());
    console.log('Days Until Expiry:', testUser.getDaysUntilExpiry());

    // Activate premium
    console.log('\n⭐ Activating premium...');
    await testUser.activatePremium('monthly', 30);
    console.log('✅ Premium activated');

    // Test after activation
    console.log('\n📊 After activation:');
    console.log('Is Premium:', testUser.isPremium);
    console.log('Premium Plan:', testUser.premiumPlan);
    console.log('Premium Expires At:', testUser.premiumExpiresAt);
    console.log('Is Premium Active:', testUser.isPremiumActive());
    console.log('Days Until Expiry:', testUser.getDaysUntilExpiry());

    // Test getPublicProfile includes email
    console.log('\n📧 Testing getPublicProfile:');
    const publicProfile = testUser.getPublicProfile();
    console.log('Public profile has email:', !!publicProfile.email);
    console.log('Public profile keys:', Object.keys(publicProfile));

    // Test with email included (like in auth routes)
    console.log('\n📧 Testing with email included:');
    const userWithEmail = { ...publicProfile, email: testUser.email };
    console.log('User with email has email:', !!userWithEmail.email);
    console.log('User email:', userWithEmail.email);

    // Clean up
    console.log('\n🧹 Cleaning up...');
    await User.deleteOne({ email: 'premium@test.com' });
    console.log('✅ Test user deleted');

    console.log('\n🎉 Premium test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testPremium(); 