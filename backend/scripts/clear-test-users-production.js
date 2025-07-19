const mongoose = require('mongoose');
const User = require('../models/User');

async function clearTestUsers() {
  try {
    console.log('🔍 Starting user cleanup...');
    
    // Use the actual production MongoDB Atlas connection
    const mongoUri = 'mongodb+srv://emmanuelafamngene:ZL3743xjQkAt1YqD@cluster0.ouve9zj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log(`🔍 Connecting to production database...`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas');

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
      console.log('✅ Disconnected from MongoDB');
    }
  }
}

// Run the script
clearTestUsers(); 