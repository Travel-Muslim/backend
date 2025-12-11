const express = require('express');
const ReviewController = require('../controllers/ReviewController');
const { protect } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/upload');

const router = express.Router();

router.get('/', protect, ReviewController.getAll);
router.post('/', protect, uploadImage.array('media', 5), ReviewController.createReview);
router.put('/:id', protect, ReviewController.updateReview);
router.delete('/:id', protect, ReviewController.deleteReview);

module.exports = router;