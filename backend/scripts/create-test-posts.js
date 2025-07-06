const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createTestPosts = async () => {
  try {
    // Get a user to create posts for
    const user = await User.findOne();
    if (!user) {
      console.log('No users found. Please create a user first.');
      return;
    }

    console.log(`Creating test posts for user: ${user.username}`);

    // Create regular feed posts
    const feedPosts = [
      {
        author: user._id,
        content: "Just had an amazing day at the beach! The weather was perfect and the waves were incredible. 🏖️🌊",
        tags: ['beach', 'summer', 'fun'],
        isPrivate: false
      },
      {
        author: user._id,
        content: "Working on some exciting new projects today. Can't wait to share the results with everyone! 💻✨",
        tags: ['work', 'projects', 'excited'],
        isPrivate: false
      },
      {
        author: user._id,
        content: "Made the best homemade pizza tonight! 🍕 The secret is in the dough. Anyone want the recipe?",
        tags: ['food', 'cooking', 'pizza'],
        isPrivate: false
      }
    ];

    // Create confession posts
    const confessionPosts = [
      {
        author: user._id,
        content: "Confession: I've been secretly learning to play guitar for 6 months and I'm still terrible at it. But I won't give up! 🎸",
        tags: ['confession', 'guitar', 'learning'],
        isPrivate: false
      },
      {
        author: user._id,
        content: "Confession: I sometimes talk to my plants and I'm convinced they respond. Am I crazy or do they actually grow better? 🌱",
        tags: ['confession', 'plants', 'crazy'],
        isPrivate: false
      },
      {
        author: user._id,
        content: "Confession: I've watched the same movie 47 times and I still cry at the same scene every single time. 😭",
        tags: ['confession', 'movies', 'emotional'],
        isPrivate: false
      },
      {
        author: user._id,
        content: "Confession: I have a secret collection of socks with funny patterns. I have over 50 pairs and I'm not ashamed! 🧦",
        tags: ['confession', 'socks', 'collection'],
        isPrivate: false
      }
    ];

    // Create swipe game posts
    const swipePosts = [
      {
        author: user._id,
        content: "Check out this amazing sunset I captured yesterday! Nature is truly breathtaking. 🌅",
        tags: ['sunset', 'nature', 'photography'],
        isPrivate: false
      },
      {
        author: user._id,
        content: "My cat just did the most adorable thing ever! She's trying to catch her own tail and it's the cutest thing I've ever seen. 😸",
        tags: ['cat', 'cute', 'funny'],
        isPrivate: false
      },
      {
        author: user._id,
        content: "Just finished reading an incredible book that completely changed my perspective on life. Highly recommend! 📚",
        tags: ['books', 'reading', 'inspiration'],
        isPrivate: false
      },
      {
        author: user._id,
        content: "Made a delicious smoothie bowl this morning! It's almost too pretty to eat... almost. 🥝🍓",
        tags: ['food', 'healthy', 'breakfast'],
        isPrivate: false
      }
    ];

    // Create all posts
    const allPosts = [...feedPosts, ...confessionPosts, ...swipePosts];
    
    for (const postData of allPosts) {
      const post = new Post(postData);
      await post.save();
      console.log(`Created post: ${post.content.substring(0, 50)}...`);
    }

    console.log(`✅ Successfully created ${allPosts.length} test posts!`);
    console.log(`- ${feedPosts.length} feed posts`);
    console.log(`- ${confessionPosts.length} confession posts`);
    console.log(`- ${swipePosts.length} swipe posts`);

  } catch (error) {
    console.error('Error creating test posts:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestPosts(); 