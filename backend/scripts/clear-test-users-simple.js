const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function clearTestUsers() {
  try {
    console.log('🔍 Starting user cleanup...');
    
    // Use the same connection logic as server.js
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ No MongoDB URI found in environment variables');
      console.log('Please set MONGODB_URI or MONGO_URI in your .env file');
      return;
    }

    console.log(`🔍 Connecting to database...`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

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
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\n💡 Database connection failed. Please check:');
      console.log('1. Your .env file has the correct MONGODB_URI');
      console.log('2. The database server is running');
      console.log('3. Your network connection');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    }
  }
}

// Run the script
clearTestUsers(); 