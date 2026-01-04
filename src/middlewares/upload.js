console.log('UPLOAD MODULE LOADED');

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

const imageFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files allowed!'), false);
  }
  cb(null, true);
};

const folderMap = {
  avatar: 'muslimah-travel/avatars',
  media: 'muslimah-travel/review-media',
  payment_proof: 'muslimah-travel/payment-proofs',
  image: 'muslimah-travel/package-images',
  cover_image: 'muslimah-travel/article-covers',
  banner: 'muslimah-travel/banners',
  thumbnail: 'muslimah-travel/thumbnails',
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const folder = folderMap[file.fieldname] || 'muslimah-travel/misc';

    return {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: `${file.fieldname}-${Date.now()}`,
      transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
    };
  },
});

// Memory storage for buffer-based uploads (e.g., reviews with manual Cloudinary upload)
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

// Upload for review media (uses memory storage for buffer access)
const uploadReviewMedia = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files allowed!'), false);
    }
  },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File terlalu besar! Maksimal 5MB.',
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Error uploading file',
    });
  }

  next();
};

module.exports = { upload, uploadReviewMedia, handleMulterError };
