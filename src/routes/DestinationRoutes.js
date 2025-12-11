const express = require('express');
const DestinationController = require('../controllers/DestinationController');
const { protect, isAdmin } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/upload');

const router = express.Router();

router.get('/', protect, DestinationController.getAll);
router.get('/:id', protect, DestinationController.getById);

router.post('/', protect, isAdmin, uploadImage.single('image'), DestinationController.createDestination);
router.put('/:id', protect, isAdmin, uploadImage.single('image'), DestinationController.updateDestination);
router.delete('/:id', protect, isAdmin, DestinationController.deleteDestination);

module.exports = router;