const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth } = require('../middlewares/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || '639186169578869',
  api_secret: process.env.CLOUDINARY_API_SECRET || '6pLBSW_Giu1wJlF8WV9Jw72LxjI'
});

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow video and image files
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and image files are allowed'), false);
    }
  }
});

// Route for uploading files to Cloudinary
router.post('/upload-to-cloudinary', auth, upload.single('file'), async (req, res) => {
  console.log('Received upload request from:', req.user.username);
  
  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    const { type } = req.body;
    const resourceType = type?.startsWith('video/') ? 'video' : 'image';

    console.log(`Uploading ${resourceType} file: ${req.file.originalname}`);

    // Convert buffer to base64
    const fileBuffer = req.file.buffer;
    const base64File = fileBuffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${base64File}`;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      resource_type: resourceType,
      folder: 'afex/shorts',
      public_id: `short_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transformation: resourceType === 'video' ? [
        { width: 1080, height: 1920, crop: 'fill', gravity: 'center' }
      ] : [
        { width: 1080, height: 1920, crop: 'fill', gravity: 'center' }
      ]
    });

    console.log(`File uploaded successfully: ${uploadResult.public_id}`);

    res.json({
      success: true,
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration
    });

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Upload failed', 
      details: error.message 
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 100MB.'
      });
    }
  }
  
  if (error.message === 'Only video and image files are allowed') {
    return res.status(400).json({
      success: false,
      error: 'Only video and image files are allowed'
    });
  }
  
  next(error);
});

module.exports = router; 