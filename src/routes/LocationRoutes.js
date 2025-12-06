const express = require('express');
const LocationController = require('../controllers/LocationController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, LocationController.getAll);

module.exports = router;