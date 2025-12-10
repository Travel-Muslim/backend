const express = require('express');
const PackageController = require('../controllers/PackageController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, PackageController.getAll);

router.get('/:id', protect, PackageController.getPackageDetail);

module.exports = router;