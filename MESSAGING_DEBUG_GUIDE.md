# AFEX Messaging Debug Guide

## 🔍 **Common Issues & Solutions**

### **1. Messages Not Being Received**

#### **Check Socket Connection:**
- Look for the "Connecting..." indicator in the top-right corner
- Open browser console (F12) and look for socket connection logs
- Check if you see "✅ Socket.IO connected with ID: [socket-id]"

#### **Check User Authentication:**
- Make sure both users are logged in
- Verify that both users have valid JWT tokens
- Check if the user IDs are correct in the conversation

#### **Check Conversation Creation:**
- Verify that a conversation exists between the two users
- Check if the conversation ID is valid
- Ensure both users are participants in the conversation

### **2. Socket Connection Issues**

#### **Network Issues:**
- Check if your internet connection is stable
- Try refreshing the page
- Check if the backend is running on Render

#### **Browser Issues:**
- Try a different browser
- Clear browser cache and cookies
- Disable browser extensions that might block WebSocket connections

#### **Firewall/Proxy Issues:**
- Check if your network blocks WebSocket connections
- Try using a different network (mobile hotspot)

### **3. Backend Issues**

#### **Check Render Logs:**
1. Go to your Render dashboard
2. Select your backend service
3. Check the logs for any errors
4. Look for socket connection errors or message processing errors

#### **Common Backend Errors:**
- MongoDB connection issues
- JWT token validation errors
- Missing environment variables
- Socket.IO configuration issues

### **4. Frontend Debugging**

#### **Browser Console Logs:**
Open browser console (F12) and look for these logs:

**✅ Good logs:**
```
🔍 Setting up Socket.IO connection to: https://afoxlys.onrender.com
✅ Socket.IO connected with ID: [socket-id]
🔍 Current user ID: [user-id]
🔍 Emitted join event for user: [user-id]
🔍 handleSendMessage called with: [message]
🔍 Message emitted to socket
```

**❌ Bad logs:**
```
❌ Socket.IO connection error: [error]
❌ Socket not connected, trying API fallback
❌ Failed to send message via API: [error]
```

#### **Network Tab:**
1. Open browser DevTools
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Check if WebSocket connection is established
5. Look for failed requests

### **5. Testing Steps**

#### **Step 1: Test Socket Connection**
1. Open browser console
2. Navigate to the chat page
3. Check for connection logs
4. Verify "Connecting..." indicator disappears

#### **Step 2: Test Message Sending**
1. Select a conversation
2. Send a test message
3. Check console for send logs
4. Verify message appears in your chat

#### **Step 3: Test Message Receiving**
1. Have another user send you a message
2. Check if you receive it in real-time
3. Check console for receive logs
4. Verify message appears in your chat

#### **Step 4: Test API Fallback**
1. Disconnect your internet temporarily
2. Try to send a message
3. Check if it uses API fallback
4. Reconnect and check if message appears

### **6. Manual Testing Script**

Use the `test-messaging.js` script to test the messaging system:

1. **Install dependencies:**
   ```bash
   npm install axios socket.io-client
   ```

2. **Update the script with real user data:**
   - Replace `USER1_ID` and `USER2_ID` with actual user IDs
   - Replace `USER1_TOKEN` and `USER2_TOKEN` with actual JWT tokens

3. **Run the test:**
   ```bash
   node test-messaging.js
   ```

### **7. Environment Variables Check**

Make sure these environment variables are set in Render:

- `MONGO_URI` or `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (usually 5000)

### **8. Common Fixes**

#### **Fix 1: Restart Backend**
1. Go to Render dashboard
2. Select your backend service
3. Click "Manual Deploy"
4. Wait for deployment to complete

#### **Fix 2: Clear Browser Data**
1. Clear browser cache and cookies
2. Log out and log back in
3. Try sending messages again

#### **Fix 3: Check User Permissions**
1. Verify both users exist in the database
2. Check if users have proper authentication
3. Ensure conversation participants are correct

### **9. Getting Help**

If you're still having issues:

1. **Check the logs** - Look at browser console and Render logs
2. **Test with different users** - Try with different user accounts
3. **Test on different devices** - Try on mobile vs desktop
4. **Check network** - Try different networks
5. **Provide error details** - Share specific error messages and logs

### **10. Expected Behavior**

**✅ Working correctly:**
- Messages appear instantly for both sender and receiver
- Socket connection shows as connected
- No error messages in console
- Messages persist after page refresh

**❌ Not working:**
- Messages don't appear for receiver
- Socket connection fails
- Error messages in console
- Messages disappear after refresh

---

**Remember:** The messaging system has both real-time (Socket.IO) and fallback (API) methods. If Socket.IO fails, messages should still be sent via API and appear after a page refresh. 