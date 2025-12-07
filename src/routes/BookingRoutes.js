const express = require("express");
const BookingController = require("../controllers/BookingController");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.get("/active", protect, BookingController.getActiveBookings);
router.get("/history", protect, BookingController.getBookingHistory);

router.get(
  "/:booking_id/download-ticket",
  protect,
  BookingController.downloadTicket
);
router.put("/:booking_id/cancel", protect, BookingController.cancelBooking);
router.get("/:booking_id", protect, BookingController.getBookingDetail);

router.post("/", protect, BookingController.createBooking);
router.get("/", protect, BookingController.getBookingsWithFilter);

module.exports = router;
