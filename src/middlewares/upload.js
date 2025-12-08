const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const imageFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files allowed!'), false);
  }
  cb(null, true);
};

const storageAvatar = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars');
  },
  filename: function (req, file, cb) {
    cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadAvatar = multer({
  storage: storageAvatar,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter
});

const reviewImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'muslimah-travel/review-media',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  }
});

const uploadReviewMedia = multer({
  storage: reviewImageStorage,
  fileFilter: imageFilter
}); 

module.exports = {
  uploadAvatar,
  uploadReviewMedia
};
