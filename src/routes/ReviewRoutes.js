const express = require('express');
const ReviewController = require('../controllers/ReviewController');
const { protect } = require('../middlewares/auth');
const { uploadReviewMedia } = require('../middlewares/upload');

const router = express.Router();

router.get('/', protect, ReviewController.getAll);
router.post('/', protect, ReviewController.createReview);
router.put('/:id', protect, ReviewController.updateReview);
router.delete('/:id', protect, ReviewController.deleteReview);
router.post('/reviews',
  protect,
  uploadReviewMedia.array('media', 5),
  ReviewController.createReview
);

module.exports = router;