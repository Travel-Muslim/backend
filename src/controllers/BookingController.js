const Booking = require("../models/bookings");
const PDFDocument = require("pdfkit");

const BookingController = {
  getActiveBookings: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result = await Booking.findActiveByUser(req.user.id, limit, offset);

      res.status(200).json({
        status: 200,
        message: "Success",
        data: result.data,
        pagination: {
          page,
          limit,
          total_items: result.total,
          total_pages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getBookingHistory: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const status = req.query.status;

      const result = await Booking.findHistoryByUser(
        req.user.id,
        limit,
        offset,
        status
      );

      res.status(200).json({
        status: 200,
        message: "Success",
        data: result.data,
        pagination: {
          page,
          limit,
          total_items: result.total,
          total_pages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getBookingDetail: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.booking_id);

      if (!booking) {
        return res
          .status(404)
          .json({ status: 404, message: "Booking not found" });
      }

      if (booking.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          status: 403,
          message: "You don't have access to this booking",
        });
      }

      res.status(200).json({
        status: 200,
        message: "Success",
        data: booking,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  downloadTicket: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.booking_id);

      if (!booking)
        return res
          .status(404)
          .json({ status: 404, message: "Booking not found" });

      if (booking.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ status: 403, message: "Forbidden" });
      }

      if (booking.payment_status !== "paid") {
        return res.status(400).json({
          status: 400,
          message: "Cannot download ticket, payment not completed",
        });
      }

      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const filename = `ticket-${booking.booking_code}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      doc.pipe(res);
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f4eee6");
      doc.save();
      doc.roundedRect(80, 150, doc.page.width - 160, 35, 4).fill("#bfa2e8");
      doc
        .fillColor("#fff")
        .fontSize(16)
        .text("E-Ticket", 0, 160, { align: "center" });
      doc.restore();

      const contentY = 200;
      doc
        .roundedRect(80, contentY, doc.page.width - 160, 430, 4)
        .fill("#ffffff");

      let y = contentY + 20;
      const labelX = 100;

      function writeRow(label, value) {
        doc
          .font("Helvetica-Bold")
          .fillColor("#000")
          .fontSize(13)
          .text(label, labelX, y);
        y += 18;
        doc
          .font("Helvetica")
          .fillColor("#444")
          .fontSize(13)
          .text(value, labelX, y);
        y += 28;
      }

      writeRow("Booking Code :", booking.booking_code);
      writeRow("Package :", booking.package_name);
      writeRow("Date :", booking.departure_date);
      writeRow("Email :", booking.email);
      writeRow("Traveler :", booking.full_name);

      doc
        .fillColor("#7b4ab8")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Please show this ticket upon arrival.", 0, 650, {
          align: "center",
        });

      doc.end();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  cancelBooking: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.booking_id);

      if (!booking)
        return res
          .status(404)
          .json({ status: 404, message: "Booking not found" });

      if (booking.user_id !== req.user.id) {
        return res.status(403).json({ status: 403, message: "Forbidden" });
      }

      if (booking.status === "cancelled") {
        return res
          .status(400)
          .json({ status: 400, message: "Booking already cancelled" });
      }

      if (new Date(booking.departure_date) <= new Date()) {
        return res.status(400).json({
          status: 400,
          message: "Cannot cancel, trip already started",
        });
      }

      const updatedBooking = await Booking.cancel(
        req.params.booking_id,
        req.body.cancel_reason
      );

      res.status(200).json({
        status: 200,
        message: "Booking cancelled successfully",
        data: updatedBooking,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  createBooking: async (req, res) => {
    try {
      const bookingData = {
        user_id: req.user.id,
        ...req.body,
      };

      const newBooking = await Booking.create(bookingData);

      res.status(201).json({
        status: 201,
        message: "Booking created successfully",
        data: newBooking,
      });
    } catch (error) {
      if (error.message === "PACKAGE_NOT_FOUND") {
        return res
          .status(404)
          .json({ status: 404, message: "Package not found" });
      }
      if (error.message === "QUOTA_FULL") {
        return res
          .status(400)
          .json({ status: 400, message: "Package quota is full" });
      }
      res.status(500).json({ message: error.message });
    }
  },

  getBookingsWithFilter: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const filters = {
        user_id: req.user.id,
        status: req.query.status,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        search: req.query.search,
      };

      const result = await Booking.findAll(filters, limit, offset);

      res.status(200).json({
        status: 200,
        message: "Success",
        data: result.data,
        pagination: {
          page,
          limit,
          total_items: result.total,
          total_pages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = BookingController;
