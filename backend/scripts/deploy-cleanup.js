const mongoose = require('mongoose');
const User = require('../models/User');

// This script should be run on the production server
// It uses the same environment variables as the main application

async function deployCleanup() {
  try {
    console.log('🔍 Starting production cleanup deployment...');
    
    // Use the same connection logic as the main server
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ No MongoDB URI found in environment variables');
      console.log('Please set MONGODB_URI or MONGO_URI in your environment');
      return;
    }

    console.log(`🔍 Connecting to production database...`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to production database');

    // Find users with usernames starting with emmanuel, onyekachi, or test
    const testUsers = await User.find({
      $or: [
        { username: { $regex: '^emmanuel', $options: 'i' } },
        { username: { $regex: '^onyekachi', $options: 'i' } },
        { username: { $regex: '^test', $options: 'i' } }
      ]
    });

    console.log(`🔍 Found ${testUsers.length} users to remove:`);
    testUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email})`);
    });

    if (testUsers.length === 0) {
      console.log('✅ No users found matching the criteria');
      return;
    }

    // Delete the users
    const deleteResult = await User.deleteMany({
      $or: [
        { username: { $regex: '^emmanuel', $options: 'i' } },
        { username: { $regex: '^onyekachi', $options: 'i' } },
        { username: { $regex: '^test', $options: 'i' } }
      ]
    });

    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} users`);

    // Verify deletion
    const remainingUsers = await User.find({
      $or: [
        { username: { $regex: '^emmanuel', $options: 'i' } },
        { username: { $regex: '^onyekachi', $options: 'i' } },
        { username: { $regex: '^test', $options: 'i' } }
      ]
    });

    if (remainingUsers.length === 0) {
      console.log('✅ Verification: All matching users have been removed');
    } else {
      console.log(`⚠️  Warning: ${remainingUsers.length} users still remain`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('✅ Disconnected from database');
    }
  }
}

// Run the script
deployCleanup(); 