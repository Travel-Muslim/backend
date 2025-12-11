const express = require('express');
const AdminController = require('../controllers/AdminController');
const { protect, isAdmin } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.use(isAdmin);

router.get('/stats', protect, isAdmin, AdminController.getDashboardStats);
router.get('/top-packages', protect, isAdmin, AdminController.getTopPackages);
router.get('/top-buyers', protect, isAdmin, AdminController.getTopBuyers);
router.get('/booking-status', protect, isAdmin, AdminController.getBookingStatus);
module.exports = router;