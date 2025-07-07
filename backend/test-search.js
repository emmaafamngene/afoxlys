const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function testSearch() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check total users
    const totalUsers = await User.countDocuments();
    console.log(`👥 Total users in database: ${totalUsers}`);

    if (totalUsers === 0) {
      console.log('❌ No users found in database. This is why search returns empty results.');
      return;
    }

    // Get sample users
    const users = await User.find().limit(5).select('username firstName lastName isPrivate');
    console.log('👤 Sample users:', users.map(u => ({
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      isPrivate: u.isPrivate
    })));

    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    
    // Test 1: Search by username
    const searchQuery1 = users[0]?.username?.substring(0, 3) || 'test';
    console.log(`🔍 Searching for: "${searchQuery1}"`);
    
    const searchConditions1 = {
      $or: [
        { username: { $regex: searchQuery1, $options: 'i' } },
        { firstName: { $regex: searchQuery1, $options: 'i' } },
        { lastName: { $regex: searchQuery1, $options: 'i' } },
        { bio: { $regex: searchQuery1, $options: 'i' } }
      ]
    };
    
    const results1 = await User.find(searchConditions1).select('username firstName lastName');
    console.log(`✅ Found ${results1.length} users for "${searchQuery1}":`, results1.map(u => u.username));

    // Test 2: Search without privacy filtering
    console.log('\n🔍 Testing search without privacy filtering...');
    const results2 = await User.find(searchConditions1)
      .select('username firstName lastName isPrivate')
      .limit(10);
    console.log(`✅ Found ${results2.length} users (no privacy filter):`, results2.map(u => ({ username: u.username, isPrivate: u.isPrivate })));

    // Test 3: Search with privacy filtering
    console.log('\n🔍 Testing search with privacy filtering...');
    const searchConditions3 = {
      $or: [
        { username: { $regex: searchQuery1, $options: 'i' } },
        { firstName: { $regex: searchQuery1, $options: 'i' } },
        { lastName: { $regex: searchQuery1, $options: 'i' } },
        { bio: { $regex: searchQuery1, $options: 'i' } }
      ],
      isPrivate: false
    };
    
    const results3 = await User.find(searchConditions3).select('username firstName lastName isPrivate');
    console.log(`✅ Found ${results3.length} public users for "${searchQuery1}":`, results3.map(u => ({ username: u.username, isPrivate: u.isPrivate })));

    // Test 4: Check if all users are private
    const privateUsers = await User.countDocuments({ isPrivate: true });
    const publicUsers = await User.countDocuments({ isPrivate: false });
    console.log(`\n📊 Privacy breakdown:`);
    console.log(`- Private users: ${privateUsers}`);
    console.log(`- Public users: ${publicUsers}`);

    if (privateUsers === totalUsers) {
      console.log('⚠️  All users are private! This is why search returns empty results.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testSearch(); 