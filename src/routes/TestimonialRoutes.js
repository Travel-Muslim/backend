const express = require('express');
const TestimonialController = require('../controllers/TestimonialController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, TestimonialController.getAll);

module.exports = router;