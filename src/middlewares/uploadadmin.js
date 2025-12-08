const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const adminPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'muslimah-travel/package-images',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: () => `package-${Date.now()}`
  }
});

const uploadPackageImage = multer({
  storage: adminPhotoStorage,
  limits: { fileSize: 3 * 1024 * 1024 }
});

module.exports = uploadPackageImage;
