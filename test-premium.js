const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./backend/models/User');
const Payment = require('./backend/models/Payment');

async function testPremium() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Create a test user
    console.log('\n👤 Test 1: Creating test user...');
    let testUser = await User.findOne({ email: 'premium-test@example.com' });
    if (!testUser) {
      testUser = new User({
        username: 'premiumtester',
        email: 'premium-test@example.com',
        password: 'password123',
        firstName: 'Premium',
        lastName: 'Tester'
      });
      await testUser.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user already exists');
    }

    // Test 2: Check initial premium status
    console.log('\n🔍 Test 2: Checking initial premium status...');
    console.log('Is Premium:', testUser.isPremium);
    console.log('Premium Plan:', testUser.premiumPlan);
    console.log('Premium Expires At:', testUser.premiumExpiresAt);
    console.log('Is Premium Active:', testUser.isPremiumActive());
    console.log('Days Until Expiry:', testUser.getDaysUntilExpiry());

    // Test 3: Activate premium (monthly)
    console.log('\n⭐ Test 3: Activating premium (monthly)...');
    await testUser.activatePremium('monthly', 30);
    console.log('✅ Premium activated');
    console.log('Is Premium:', testUser.isPremium);
    console.log('Premium Plan:', testUser.premiumPlan);
    console.log('Premium Expires At:', testUser.premiumExpiresAt);
    console.log('Is Premium Active:', testUser.isPremiumActive());
    console.log('Days Until Expiry:', testUser.getDaysUntilExpiry());

    // Test 4: Add payment record
    console.log('\n💰 Test 4: Adding payment record...');
    await testUser.addPaymentRecord(1000, 'test_transaction_123', 'completed');
    console.log('✅ Payment record added');
    console.log('Payment History:', testUser.premiumPaymentHistory);

    // Test 5: Test yearly premium
    console.log('\n📅 Test 5: Testing yearly premium...');
    const yearlyUser = new User({
      username: 'yearlytester',
      email: 'yearly-test@example.com',
      password: 'password123',
      firstName: 'Yearly',
      lastName: 'Tester'
    });
    await yearlyUser.save();
    await yearlyUser.activatePremium('yearly', 365);
    console.log('✅ Yearly premium activated');
    console.log('Premium Plan:', yearlyUser.premiumPlan);
    console.log('Premium Expires At:', yearlyUser.premiumExpiresAt);
    console.log('Days Until Expiry:', yearlyUser.getDaysUntilExpiry());

    // Test 6: Test expired premium
    console.log('\n⏰ Test 6: Testing expired premium...');
    const expiredUser = new User({
      username: 'expiredtester',
      email: 'expired-test@example.com',
      password: 'password123',
      firstName: 'Expired',
      lastName: 'Tester'
    });
    await expiredUser.save();
    expiredUser.isPremium = true;
    expiredUser.premiumExpiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    await expiredUser.save();
    console.log('✅ Expired premium user created');
    console.log('Is Premium:', expiredUser.isPremium);
    console.log('Is Premium Active:', expiredUser.isPremiumActive());
    console.log('Days Until Expiry:', expiredUser.getDaysUntilExpiry());

    // Test 7: Test premium status API endpoint
    console.log('\n🌐 Test 7: Testing premium status API simulation...');
    const premiumStatus = {
      success: true,
      isPremium: testUser.isPremium,
      isPremiumActive: testUser.isPremiumActive(),
      premiumExpiresAt: testUser.premiumExpiresAt,
      premiumPlan: testUser.premiumPlan,
      daysUntilExpiry: testUser.getDaysUntilExpiry(),
      paymentHistory: testUser.premiumPaymentHistory
    };
    console.log('Premium Status API Response:', JSON.stringify(premiumStatus, null, 2));

    // Test 8: Test payment verification simulation
    console.log('\n🔐 Test 8: Testing payment verification simulation...');
    const mockPaymentVerification = {
      reference: 'test_reference_123',
      email: testUser.email,
      amount: 100000, // ₦1000 in kobo
      status: 'success'
    };
    console.log('Mock Payment Data:', mockPaymentVerification);

    // Test 9: Bulk premium activation test
    console.log('\n📊 Test 9: Testing bulk premium operations...');
    const users = await User.find({ isPremium: true });
    console.log(`Total premium users: ${users.length}`);
    
    const activePremiumUsers = users.filter(user => user.isPremiumActive());
    console.log(`Active premium users: ${activePremiumUsers.length}`);
    
    const expiredPremiumUsers = users.filter(user => !user.isPremiumActive() && user.isPremium);
    console.log(`Expired premium users: ${expiredPremiumUsers.length}`);

    // Test 10: Premium features simulation
    console.log('\n🎯 Test 10: Testing premium features...');
    const premiumFeatures = {
      noAds: testUser.isPremiumActive(),
      privateStories: testUser.isPremiumActive(),
      postBoost: testUser.isPremiumActive(),
      premiumBadge: testUser.isPremiumActive(),
      exclusiveContent: testUser.isPremiumActive(),
      prioritySupport: testUser.isPremiumActive()
    };
    console.log('Premium Features Access:', premiumFeatures);

    console.log('\n🎉 All Premium tests completed successfully!');

    // Clean up test data (optional)
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteMany({ 
      email: { 
        $in: ['premium-test@example.com', 'yearly-test@example.com', 'expired-test@example.com'] 
      } 
    });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Additional test functions for specific scenarios
async function testPremiumPaymentFlow() {
  console.log('\n🔄 Testing Premium Payment Flow...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Simulate payment initialization
    console.log('1. Payment Initialization...');
    const paymentInit = {
      email: 'test@example.com',
      plan: 'monthly',
      amount: 100000, // ₦1000 in kobo
      reference: `ref_${Date.now()}`,
      authorizationUrl: 'https://checkout.paystack.com/test'
    };
    console.log('Payment Init Response:', paymentInit);

    // Simulate payment verification
    console.log('\n2. Payment Verification...');
    const paymentVerification = {
      reference: paymentInit.reference,
      email: paymentInit.email,
      amount: paymentInit.amount,
      status: 'success',
      transactionId: `txn_${Date.now()}`
    };
    console.log('Payment Verification Data:', paymentVerification);

    // Simulate premium activation
    console.log('\n3. Premium Activation...');
    const user = await User.findOne({ email: 'test@example.com' }) || new User({
      username: 'paymenttester',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Payment',
      lastName: 'Tester'
    });
    
    await user.activatePremium('monthly', 30);
    await user.addPaymentRecord(1000, paymentVerification.transactionId, 'completed');
    
    console.log('Premium Activation Result:', {
      isPremium: user.isPremium,
      isPremiumActive: user.isPremiumActive(),
      premiumExpiresAt: user.premiumExpiresAt,
      daysUntilExpiry: user.getDaysUntilExpiry()
    });

    console.log('✅ Payment flow test completed');

  } catch (error) {
    console.error('❌ Payment flow test error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run tests
if (require.main === module) {
  testPremium().then(() => {
    console.log('\n🚀 Starting payment flow test...');
    return testPremiumPaymentFlow();
  }).catch(console.error);
}

module.exports = { testPremium, testPremiumPaymentFlow }; 