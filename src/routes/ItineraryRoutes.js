const express = require('express');
const ItineraryController = require('../controllers/ItineraryController');
const { protect, isAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/:package_id', protect, ItineraryController.getByPackageId);

router.post('/', protect, isAdmin, ItineraryController.createItinerary);
router.put('/:id', protect, isAdmin, ItineraryController.updateItinerary);
router.delete('/:id', protect, isAdmin, ItineraryController.deleteItinerary);

module.exports = router;