const https = require('https');

console.log('🔍 Testing backend health...');

const testEndpoints = [
  '/api/health',
  '/api/posts/feed',
  '/api/confessions',
  '/api/swipe/post'
];

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'afoxlys.onrender.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AFEX-Test/1.0'
      }
    };

    console.log(`📡 Testing: ${path}`);
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ ${path}: Status ${res.statusCode}`);
        try {
          const jsonData = JSON.parse(data);
          if (path === '/api/posts/feed' && jsonData.posts) {
            console.log(`   📝 Found ${jsonData.posts.length} posts`);
          }
        } catch (e) {
          console.log(`   📄 Response: ${data.substring(0, 100)}...`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${path}: ${e.message}`);
      resolve();
    });

    req.on('timeout', () => {
      console.log(`⏰ ${path}: Timeout`);
      req.destroy();
      resolve();
    });

    req.setTimeout(10000);
    req.end();
  });
}

async function runTests() {
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('🏁 All tests completed');
}

runTests(); 