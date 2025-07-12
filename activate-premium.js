const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./backend/models/User');

async function activatePremiumForUser(email, plan = 'monthly') {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found. Please provide a valid email.');
      return;
    }

    console.log(`👤 Found user: ${user.username} (${user.email})`);
    console.log(`📊 Current premium status: ${user.isPremium ? 'Premium' : 'Free'}`);

    // Activate premium
    const duration = plan === 'yearly' ? 365 : 30;
    await user.activatePremium(plan, duration);
    
    // Add a mock payment record
    await user.addPaymentRecord(plan === 'yearly' ? 10000 : 1000, `test_${Date.now()}`, 'completed');

    console.log(`\n🎉 Premium activated successfully!`);
    console.log(`📅 Plan: ${user.premiumPlan}`);
    console.log(`⏰ Expires: ${user.premiumExpiresAt}`);
    console.log(`📊 Days until expiry: ${user.getDaysUntilExpiry()}`);
    console.log(`✅ Is premium active: ${user.isPremiumActive()}`);

    // Show premium features
    console.log(`\n🎯 Premium features now available:`);
    console.log(`- No Ads: ${user.isPremiumActive() ? '✅' : '❌'}`);
    console.log(`- Private Stories: ${user.isPremiumActive() ? '✅' : '❌'}`);
    console.log(`- Post Boost: ${user.isPremiumActive() ? '✅' : '❌'}`);
    console.log(`- Premium Badge: ${user.isPremiumActive() ? '✅' : '❌'}`);
    console.log(`- Exclusive Content: ${user.isPremiumActive() ? '✅' : '❌'}`);
    console.log(`- Priority Support: ${user.isPremiumActive() ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0];
const plan = args[1] || 'monthly';

if (!email) {
  console.log('Usage: node activate-premium.js <email> [plan]');
  console.log('Example: node activate-premium.js user@example.com monthly');
  console.log('Example: node activate-premium.js user@example.com yearly');
  process.exit(1);
}

if (!['monthly', 'yearly'].includes(plan)) {
  console.log('❌ Invalid plan. Use "monthly" or "yearly"');
  process.exit(1);
}

console.log(`🚀 Activating ${plan} premium for ${email}...`);
activatePremiumForUser(email, plan); 