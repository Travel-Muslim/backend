const express = require('express');
const DashboardController = require('../controllers/AdminController');
const { protect, isAdmin } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.use(isAdmin);

router.get('/stats', DashboardController.getDashboardStats);
router.get('/top-packages', DashboardController.getTopPackages);
router.get('/top-buyers', DashboardController.getTopBuyers);
router.get('/booking-status', DashboardController.getBookingStatus);
router.get('/recent-bookings', DashboardController.getRecentBookings);

module.exports = router;