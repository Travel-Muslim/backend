const express = require('express');
const PackageController = require('../controllers/PackageController');
const AdminController = require('../controllers/AdminController');
const { protect, isAdmin } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/upload');

const router = express.Router();

router.get('/', protect, PackageController.getAll);
router.get('/:id', protect, PackageController.getPackageDetail);

router.post('/', protect, isAdmin, uploadImage.single('image'), AdminController.createPackage);
router.put('/:id', protect, isAdmin, uploadImage.single('image'), AdminController.updatePackage);
router.delete('/:id', protect, isAdmin, AdminController.deletePackage);

module.exports = router;