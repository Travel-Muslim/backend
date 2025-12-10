const express = require("express");
const BookingController = require("../controllers/BookingController");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.get("/active", protect, BookingController.getActiveBookings);
router.get("/history", protect, BookingController.getBookingHistory);
router.get("/", protect, BookingController.getBookingsWithFilter);
router.post("/", protect, BookingController.createBooking);

router.get(
  "/:booking_id/download-ticket", 
  protect, 
  BookingController.downloadTicket);
router.get("/:booking_id", protect, BookingController.getBookingDetail);
router.put("/:booking_id/cancel", protect, BookingController.cancelBooking);

module.exports = router;
