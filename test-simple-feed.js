const https = require('https');

console.log('🔍 Testing feed endpoint...');

const options = {
  hostname: 'afoxlys.onrender.com',
  port: 443,
  path: '/api/posts/feed',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'AFEX-Test/1.0'
  }
};

console.log('📡 Making request to:', `https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response received');
    try {
      const jsonData = JSON.parse(data);
      console.log('✅ JSON Response:', JSON.stringify(jsonData, null, 2));
      
      if (jsonData.posts) {
        console.log(`📝 Found ${jsonData.posts.length} posts`);
        if (jsonData.posts.length > 0) {
          console.log('📋 First post:', {
            id: jsonData.posts[0]._id,
            content: jsonData.posts[0].content?.substring(0, 50) + '...',
            author: jsonData.posts[0].author?.username || 'Unknown'
          });
        }
      }
    } catch (e) {
      console.log('❌ Raw response (not JSON):', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.on('timeout', () => {
  console.error('⏰ Request timeout');
  req.destroy();
});

req.setTimeout(10000); // 10 second timeout
req.end(); 