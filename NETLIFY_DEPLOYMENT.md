# Deploying AFEX Frontend to Netlify

## Prerequisites
- Your backend is already deployed on Render at `https://afoxlys.onrender.com`
- You have a Netlify account

## Method 1: Deploy via Netlify UI (Recommended)

### Step 1: Prepare Your Repository
1. Push your code to GitHub/GitLab/Bitbucket if you haven't already
2. Make sure the `frontend` folder is in your repository

### Step 2: Deploy on Netlify
1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose your Git provider (GitHub, GitLab, etc.)
4. Select your AFEX repository
5. Configure the build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
6. Click "Deploy site"

### Step 3: Configure Environment Variables (Optional)
If you want to override the API URL, you can set environment variables in Netlify:
1. Go to Site settings > Environment variables
2. Add:
   - `REACT_APP_API_URL`: `https://afoxlys.onrender.com/api`
   - `REACT_APP_SOCKET_URL`: `https://afoxlys.onrender.com`

## Method 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify
```bash
netlify login
```

### Step 3: Deploy
```bash
cd frontend
netlify deploy --prod --dir=build
```

## Method 3: Drag and Drop (Quick Test)

### Step 1: Build the Project
```bash
cd frontend
npm run build
```

### Step 2: Deploy
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `frontend/build` folder to the deploy area
3. Your site will be live instantly

## Important Notes

### ✅ What's Already Configured
- **API URLs**: All API calls point to `https://afoxlys.onrender.com`
- **Client-side routing**: Configured with `_redirects` file
- **Build optimization**: Configured with `netlify.toml`
- **Caching**: Static assets are cached for performance

### 🔧 Configuration Files Added
- `frontend/public/_redirects` - Handles React Router routing
- `frontend/netlify.toml` - Build and deployment configuration

### 🌐 Your App Will Be Available At
- Netlify will provide a URL like: `https://your-app-name.netlify.app`
- You can set up a custom domain later

### 🔍 Testing After Deployment
1. Visit your Netlify URL
2. Try to register a new account
3. Test login functionality
4. Test all major features (posts, clips, chat, etc.)

## Troubleshooting

### If you get 404 errors on routes:
- Make sure the `_redirects` file is in the `frontend/public` folder
- Verify the `netlify.toml` file is in the `frontend` folder

### If API calls fail:
- Check that your backend is running on Render
- Verify the API URL in `frontend/src/services/api.js`

### If build fails:
- Check that all dependencies are in `package.json`
- Make sure Node.js version is compatible (we set it to 18 in `netlify.toml`)

## Next Steps After Deployment

1. **Set up a custom domain** (optional)
2. **Configure analytics** (Google Analytics, etc.)
3. **Set up form handling** if you add contact forms
4. **Configure environment variables** for different environments

Your AFEX app should now be live and fully functional! 🚀 