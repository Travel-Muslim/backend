const express = require('express');
const LocationController = require('../controllers/LocationController');
const { protect, isAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, LocationController.getAll);

router.post('/', protect, isAdmin, LocationController.createLocation);
router.put('/:id', protect, isAdmin, LocationController.updateLocation);
router.delete('/:id', protect, isAdmin, LocationController.deleteLocation);

module.exports = router;