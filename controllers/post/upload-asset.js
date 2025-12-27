const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const jwt = require('jsonwebtoken');
const asyncWrapper = require("../../middleware/async");

// Configure Cloudinary
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Controller function
const uploadAsset = asyncWrapper(async (req, res) => {
  try {
    // Verify token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided', 
        type: 'error' 
      });
    }

    // Verify JWT token
    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!req.file) {
      return res.status(400).json({
        type: 'error',
        message: 'No file uploaded'
      });
    }

    // Determine resource type based on mimetype
    const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    // Upload to Cloudinary using upload_stream
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'posts',
          transformation: resourceType === 'image' 
            ? [{ width: 1200, height: 1200, crop: 'limit' }]
            : undefined
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    return res.status(200).json({
      type: 'success',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        duration: result.duration
      },
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.log(error);
    return res.status(400).json({ 
      type: "error", 
      message: error.message || "Error occurred while uploading file, please try again."
    });
  }
});

// Export both middleware and handler
module.exports = {
  uploadMiddleware: upload.single('file'),
  uploadAsset
};