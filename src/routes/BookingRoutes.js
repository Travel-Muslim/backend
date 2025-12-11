const express = require('express');
const BookingController = require('../controllers/BookingController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get("/active", protect, BookingController.getActiveBookings);
router.get("/history", protect, BookingController.getBookingHistory);
router.get("/", protect, BookingController.getBookingsWithFilter);
router.get("/:booking_id", protect, BookingController.getBookingDetail);
router.post("/", protect, BookingController.createBooking);
router.patch("/:booking_id/cancel", protect, BookingController.cancelBooking);
router.get("/:booking_id/download-ticket", protect, BookingController.downloadTicket);

module.exports = router;