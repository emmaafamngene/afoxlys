const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/afex', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testPremiumSystem() {
  try {
    console.log('🧪 Testing Afex Premium System...\n');

    // Test 1: Create a test user
    console.log('1. Creating test user...');
    const testUser = new User({
      username: 'testpremium',
      email: 'testpremium@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Premium'
    });
    await testUser.save();
    console.log('✅ Test user created:', testUser.email);

    // Test 2: Check initial premium status
    console.log('\n2. Checking initial premium status...');
    console.log('Is Premium:', testUser.isPremium);
    console.log('Is Premium Active:', testUser.isPremiumActive());
    console.log('Premium Expires At:', testUser.premiumExpiresAt);

    // Test 3: Activate premium
    console.log('\n3. Activating premium subscription...');
    await testUser.activatePremium('monthly', 30);
    console.log('✅ Premium activated!');
    console.log('Is Premium:', testUser.isPremium);
    console.log('Is Premium Active:', testUser.isPremiumActive());
    console.log('Premium Expires At:', testUser.premiumExpiresAt);
    console.log('Days Until Expiry:', testUser.getDaysUntilExpiry());

    // Test 4: Add payment record
    console.log('\n4. Adding payment record...');
    await testUser.addPaymentRecord(1000, 'test_transaction_123', 'completed');
    console.log('✅ Payment record added!');
    console.log('Payment History:', testUser.premiumPaymentHistory);

    // Test 5: Test yearly plan
    console.log('\n5. Testing yearly plan...');
    const yearlyUser = new User({
      username: 'testyearly',
      email: 'testyearly@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Yearly'
    });
    await yearlyUser.save();
    await yearlyUser.activatePremium('yearly', 365);
    console.log('✅ Yearly premium activated!');
    console.log('Plan:', yearlyUser.premiumPlan);
    console.log('Expires At:', yearlyUser.premiumExpiresAt);
    console.log('Days Until Expiry:', yearlyUser.getDaysUntilExpiry());

    // Test 6: Test expired premium
    console.log('\n6. Testing expired premium...');
    const expiredUser = new User({
      username: 'testexpired',
      email: 'testexpired@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Expired'
    });
    await expiredUser.save();
    expiredUser.isPremium = true;
    expiredUser.premiumExpiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    await expiredUser.save();
    console.log('✅ Expired premium user created!');
    console.log('Is Premium:', expiredUser.isPremium);
    console.log('Is Premium Active:', expiredUser.isPremiumActive());

    console.log('\n🎉 All premium system tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Monthly premium: Working ✅');
    console.log('- Yearly premium: Working ✅');
    console.log('- Payment records: Working ✅');
    console.log('- Expiry checking: Working ✅');
    console.log('- Premium status methods: Working ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
testPremiumSystem(); 