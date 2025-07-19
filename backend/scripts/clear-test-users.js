const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function clearTestUsers() {
  try {
    // Try different possible MongoDB URIs
    const possibleUris = [
      process.env.MONGODB_URI,
      process.env.MONGO_URI,
      'mongodb://localhost:27017/afex',
      'mongodb+srv://username:password@cluster.mongodb.net/afex?retryWrites=true&w=majority'
    ];

    let connected = false;
    let connectionError = null;

    for (const uri of possibleUris) {
      if (!uri) continue;
      
      try {
        console.log(`🔍 Trying to connect to: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
        
        await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        
        console.log('✅ Connected to MongoDB');
        connected = true;
        break;
      } catch (error) {
        console.log(`❌ Failed to connect: ${error.message}`);
        connectionError = error;
        continue;
      }
    }

    if (!connected) {
      console.error('❌ Could not connect to any MongoDB instance');
      console.error('Please check your environment variables or database connection');
      console.error('Last error:', connectionError?.message);
      return;
    }

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

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete these users and all their data!');
    console.log('Proceeding with deletion...');
    
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
    console.error('❌ Error:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    }
  }
}

// Run the script
clearTestUsers(); 