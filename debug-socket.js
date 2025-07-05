const io = require('socket.io-client');

// Test Socket.IO connection to your Render backend
const SOCKET_URL = 'https://afoxlys.onrender.com';

console.log('🔍 Starting Socket.IO Debug Test...\n');

// Test 1: Basic Connection
async function testBasicConnection() {
  console.log('=== Test 1: Basic Socket.IO Connection ===');
  
  try {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log('❌ Connection timeout after 10 seconds');
        socket.disconnect();
        reject(new Error('Connection timeout'));
      }, 10000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Socket connected successfully!');
        console.log('   Socket ID:', socket.id);
        console.log('   Transport:', socket.io.engine.transport.name);
        console.log('   URL:', SOCKET_URL);
        socket.disconnect();
        resolve(true);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.log('❌ Socket connection failed!');
        console.log('   Error:', error.message);
        console.log('   Error type:', error.type);
        console.log('   Description:', error.description);
        console.log('   Context:', error.context);
        socket.disconnect();
        reject(error);
      });

      socket.on('error', (error) => {
        console.log('❌ Socket error:', error);
      });
    });
  } catch (error) {
    console.log('❌ Socket creation failed:', error.message);
    throw error;
  }
}

// Test 2: Connection with Authentication
async function testAuthenticatedConnection() {
  console.log('\n=== Test 2: Authenticated Connection ===');
  
  // You'll need to replace these with actual values
  const TEST_USER_ID = 'YOUR_TEST_USER_ID';
  const TEST_TOKEN = 'YOUR_TEST_JWT_TOKEN';
  
  if (TEST_USER_ID === 'YOUR_TEST_USER_ID') {
    console.log('⚠️  Skipping authenticated test - need real user data');
    return;
  }

  try {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
      auth: {
        token: TEST_TOKEN
      }
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log('❌ Authenticated connection timeout');
        socket.disconnect();
        reject(new Error('Authenticated connection timeout'));
      }, 10000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Authenticated socket connected!');
        console.log('   Socket ID:', socket.id);
        
        // Test join event
        socket.emit('join', TEST_USER_ID);
        console.log('   Emitted join event for user:', TEST_USER_ID);
        
        setTimeout(() => {
          socket.disconnect();
          resolve(true);
        }, 2000);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.log('❌ Authenticated connection failed!');
        console.log('   Error:', error.message);
        socket.disconnect();
        reject(error);
      });
    });
  } catch (error) {
    console.log('❌ Authenticated socket creation failed:', error.message);
    throw error;
  }
}

// Test 3: Backend Health Check
async function testBackendHealth() {
  console.log('\n=== Test 3: Backend Health Check ===');
  
  try {
    const axios = require('axios');
    const response = await axios.get(`${SOCKET_URL.replace('https://', 'https://')}/api/health`, {
      timeout: 10000
    });
    
    console.log('✅ Backend is healthy!');
    console.log('   Status:', response.status);
    console.log('   Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Backend health check failed!');
    console.log('   Error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    return false;
  }
}

// Test 4: Network Connectivity
async function testNetworkConnectivity() {
  console.log('\n=== Test 4: Network Connectivity ===');
  
  try {
    const https = require('https');
    const url = require('url');
    
    const parsedUrl = url.parse(SOCKET_URL);
    
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: '/',
        method: 'GET',
        timeout: 10000
      }, (res) => {
        console.log('✅ Network connectivity OK!');
        console.log('   Status:', res.statusCode);
        console.log('   Headers:', res.headers);
        resolve(true);
      });

      req.on('error', (error) => {
        console.log('❌ Network connectivity failed!');
        console.log('   Error:', error.message);
        reject(error);
      });

      req.on('timeout', () => {
        console.log('❌ Network request timeout!');
        req.destroy();
        reject(new Error('Network timeout'));
      });

      req.end();
    });
  } catch (error) {
    console.log('❌ Network test failed:', error.message);
    return false;
  }
}

// Test 5: CORS and WebSocket Support
async function testWebSocketSupport() {
  console.log('\n=== Test 5: WebSocket Support ===');
  
  try {
    const WebSocket = require('ws');
    const wsUrl = SOCKET_URL.replace('https://', 'wss://');
    
    console.log('   Testing WebSocket URL:', wsUrl);
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        console.log('❌ WebSocket connection timeout');
        ws.close();
        reject(new Error('WebSocket timeout'));
      }, 10000);

      ws.on('open', () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connection successful!');
        ws.close();
        resolve(true);
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        console.log('❌ WebSocket connection failed!');
        console.log('   Error:', error.message);
        reject(error);
      });

      ws.on('close', (code, reason) => {
        console.log('   WebSocket closed:', code, reason);
      });
    });
  } catch (error) {
    console.log('❌ WebSocket test failed:', error.message);
    console.log('   Note: This might be expected if WebSocket is not enabled');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive Socket.IO debugging...\n');
  
  const results = {
    basicConnection: false,
    authenticatedConnection: false,
    backendHealth: false,
    networkConnectivity: false,
    webSocketSupport: false
  };

  try {
    // Test 1: Basic Connection
    results.basicConnection = await testBasicConnection();
  } catch (error) {
    console.log('❌ Basic connection test failed');
  }

  try {
    // Test 2: Authenticated Connection
    results.authenticatedConnection = await testAuthenticatedConnection();
  } catch (error) {
    console.log('❌ Authenticated connection test failed');
  }

  try {
    // Test 3: Backend Health
    results.backendHealth = await testBackendHealth();
  } catch (error) {
    console.log('❌ Backend health test failed');
  }

  try {
    // Test 4: Network Connectivity
    results.networkConnectivity = await testNetworkConnectivity();
  } catch (error) {
    console.log('❌ Network connectivity test failed');
  }

  try {
    // Test 5: WebSocket Support
    results.webSocketSupport = await testWebSocketSupport();
  } catch (error) {
    console.log('❌ WebSocket support test failed');
  }

  // Summary
  console.log('\n=== Test Results Summary ===');
  console.log('Basic Connection:', results.basicConnection ? '✅ PASS' : '❌ FAIL');
  console.log('Authenticated Connection:', results.authenticatedConnection ? '✅ PASS' : '⚠️  SKIP');
  console.log('Backend Health:', results.backendHealth ? '✅ PASS' : '❌ FAIL');
  console.log('Network Connectivity:', results.networkConnectivity ? '✅ PASS' : '❌ FAIL');
  console.log('WebSocket Support:', results.webSocketSupport ? '✅ PASS' : '❌ FAIL');

  // Recommendations
  console.log('\n=== Recommendations ===');
  
  if (!results.basicConnection) {
    console.log('🔧 Fix basic connection issues first:');
    console.log('   - Check if backend is running on Render');
    console.log('   - Verify the SOCKET_URL is correct');
    console.log('   - Check Render logs for errors');
  }
  
  if (!results.backendHealth) {
    console.log('🔧 Backend health check failed:');
    console.log('   - Restart your Render backend');
    console.log('   - Check environment variables');
    console.log('   - Verify MongoDB connection');
  }
  
  if (!results.networkConnectivity) {
    console.log('🔧 Network connectivity issues:');
    console.log('   - Check your internet connection');
    console.log('   - Try a different network');
    console.log('   - Check firewall settings');
  }

  if (results.basicConnection && results.backendHealth) {
    console.log('✅ Basic infrastructure is working!');
    console.log('   - Socket.IO should work in the browser');
    console.log('   - Check browser console for detailed logs');
    console.log('   - Verify user authentication');
  }
}

// Run the tests
runAllTests().catch(console.error); 