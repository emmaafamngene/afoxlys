# 🚀 Render Deployment Guide for AFEX

## 📋 Prerequisites

1. **MongoDB Atlas Account** (for production database)
2. **Cloudinary Account** (already configured)
3. **GitHub Repository** with your code
4. **Render Account**

---

## 🔧 Environment Variables for Render

### **Required Environment Variables**

Copy these to your Render service environment variables:

```env
# Database Configuration
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/afex?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your_very_long_random_secret_key_here_make_it_at_least_32_characters

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=mediaflows_bd94f1b4-79cd-4db7-9f73-d9fe7617f2ae
CLOUDINARY_API_KEY=954559319454737
CLOUDINARY_API_SECRET=SsUPIFPgVHYkYBsqslVxihGLZAw
CLOUDINARY_URL=cloudinary://954559319454737:SsUPIFPgVHYkYBsqslVxihGLZAw@mediaflows_bd94f1b4-79cd-4db7-9f73-d9fe7617f2ae

# Production Settings
NODE_ENV=production

# CORS Origins (add your frontend domain)
FRONTEND_URL=https://your-frontend-domain.com
```

---

## 🗄️ MongoDB Atlas Setup

### 1. Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (free tier works)
3. Set up database access (username/password)
4. Set up network access (allow all IPs: `0.0.0.0/0`)

### 2. Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<username>`, `<password>`, and `<dbname>` with your values

**Example:**
```
mongodb+srv://afex_user:your_password@cluster0.abc123.mongodb.net/afex?retryWrites=true&w=majority
```

---

## 🔐 JWT Secret Generation

Generate a strong JWT secret:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/64
```

---

## 🎯 Render Deployment Steps

### 1. Create New Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository with your AFEX code

### 2. Configure Service
- **Name**: `afex-backend` (or your preferred name)
- **Environment**: `Node`
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Root Directory**: Leave empty (if backend is in a subdirectory)

### 3. Set Environment Variables
1. Go to your service → "Environment"
2. Add each environment variable from the list above
3. Make sure to use your actual MongoDB connection string
4. Use the generated JWT secret

### 4. Deploy
1. Click "Create Web Service"
2. Wait for the build to complete
3. Your API will be available at: `https://your-service-name.onrender.com`

---

## 🔗 Frontend Configuration

Update your frontend API base URL to point to your Render backend:

```javascript
// In frontend/src/services/api.js
const api = axios.create({
  baseURL: 'https://your-service-name.onrender.com/api',
  // ... rest of config
});
```

---

## ✅ Verification Steps

### 1. Test API Endpoints
Visit these URLs to verify your backend is working:

- **Health Check**: `https://your-service-name.onrender.com/api/health`
- **CORS Test**: `https://your-service-name.onrender.com/api/cors-test`
- **Shorts Endpoint**: `https://your-service-name.onrender.com/api/shorts`

### 2. Expected Responses

**Health Check Response:**
```json
{
  "status": "OK",
  "message": "AFEX API is running",
  "socket": {
    "onlineUsers": 0,
    "transports": ["websocket", "polling"]
  }
}
```

**Shorts Endpoint Response:**
```json
{
  "shorts": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "hasMore": false
  }
}
```

---

## 🐛 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check if all dependencies are in `package.json`
   - Verify build command is correct

2. **Environment Variables Not Working**
   - Make sure variables are set in Render dashboard
   - Check for typos in variable names
   - Restart the service after adding variables

3. **Database Connection Fails**
   - Verify MongoDB Atlas connection string
   - Check network access settings
   - Ensure username/password are correct

4. **CORS Errors**
   - Add your frontend domain to `FRONTEND_URL`
   - Check CORS configuration in `server.js`

### Logs
- Check Render service logs for detailed error messages
- Use `console.log()` statements for debugging

---

## 🔄 Continuous Deployment

Render automatically deploys when you push to your main branch. To update:

1. Make changes to your code
2. Push to GitHub
3. Render will automatically rebuild and deploy

---

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Verify all environment variables are set
3. Test endpoints individually
4. Check MongoDB Atlas connection

---

## 🎉 Success!

Once deployed, your AFEX backend will be available at:
`https://your-service-name.onrender.com`

Your Shorts feature with Cloudinary uploads and MongoDB storage will be fully functional! 🚀 