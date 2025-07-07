# 🌩️ Cloudinary Setup Guide for AFEX Shorts

## 📋 Prerequisites
- Cloudinary account with cloud name: `dwsnvxcd8`
- API Key: `954559319454737`
- API Secret: `954559319454737`

## 🔧 Upload Preset Configuration

### Option 1: Use Default Preset (Recommended)
The code now uses `ml_default` which is a default unsigned upload preset that should work immediately.

### Option 2: Create Custom Upload Preset

If you want to create a custom preset for better control:

1. **Login to Cloudinary Dashboard**
   - Go to [Cloudinary Console](https://console.cloudinary.com)
   - Login with your credentials

2. **Navigate to Upload Presets**
   - Go to Settings → Upload
   - Scroll down to "Upload presets"
   - Click "Add upload preset"

3. **Configure the Preset**
   - **Preset name**: `afex_shorts`
   - **Signing Mode**: Unsigned
   - **Folder**: `afex/shorts` (optional)
   - **Allowed formats**: `jpg, png, gif, mp4, mov, avi`
   - **Max file size**: `100MB` (or your preferred limit)
   - **Transformation**: 
     - For videos: `f_auto,fl_progressive`
     - For images: `f_auto,fl_progressive`

4. **Save the Preset**
   - Click "Save" to create the preset

5. **Update Code** (if using custom preset)
   ```javascript
   formData.append('upload_preset', 'afex_shorts'); // Your custom preset
   ```

## 🧪 Testing Upload

### Test with Default Preset
1. Try uploading a small image or video
2. Check browser console for detailed logs
3. Look for these success messages:
   ```
   Uploading to Cloudinary...
   Cloudinary response status: 200
   Cloudinary upload successful: {secure_url: "https://..."}
   Media URL: https://res.cloudinary.com/dwsnvxcd8/...
   ```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Invalid upload preset | Use `ml_default` or create custom preset |
| 401 Unauthorized | Wrong cloud name | Verify cloud name is `dwsnvxcd8` |
| File too large | Exceeds preset limits | Reduce file size or increase limits |
| Invalid format | File type not allowed | Check allowed formats in preset |

## 🔍 Debugging

### Check Upload Preset
```javascript
// Add this to your upload function
console.log('Upload preset:', 'ml_default');
console.log('Cloud name:', 'dwsnvxcd8');
```

### Test Direct Upload
You can test the upload directly in your browser console:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('upload_preset', 'ml_default');

fetch('https://api.cloudinary.com/v1_1/dwsnvxcd8/image/upload', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

## ✅ Success Indicators

When everything works correctly, you should see:
1. ✅ Cloudinary upload succeeds (200 status)
2. ✅ `secure_url` is returned
3. ✅ Backend receives valid `mediaUrl`
4. ✅ Short is saved to MongoDB
5. ✅ UI updates with new short

## 🚀 Next Steps

Once uploads work:
1. Test with different file types (images, videos)
2. Test with larger files
3. Add file size validation
4. Add file type validation
5. Consider adding upload progress indicators 