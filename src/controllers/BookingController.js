const Booking = require('../models/BookingModel');
const PDFDocument = require('pdfkit');
const commonHelper = require('../helpers/common');

const BookingController = {
  getActiveBookings: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result = await Booking.findActiveByUser(req.user.id, limit, offset);

      commonHelper.paginated(
        res,
        result.data,
        {
          page,
          total_pages: Math.ceil(result.total / limit),
          total_items: result.total,
          per_page: limit,
        },
        'Get active bookings successful'
      );
    } catch (error) {
      console.log(error);
      commonHelper.error(res, error.message, 500);
    }
  },

  getBookingHistory: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const status = req.query.status;

      const result = await Booking.findHistoryByUser(req.user.id, limit, offset, status);

      commonHelper.paginated(
        res,
        result.data,
        {
          page,
          total_pages: Math.ceil(result.total / limit),
          total_items: result.total,
          per_page: limit,
        },
        'Get booking history successful'
      );
    } catch (error) {
      console.log(error);
      commonHelper.error(res, error.message, 500);
    }
  },

  getBookingDetail: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.booking_id);

      if (!booking) {
        return commonHelper.notFound(res, 'Booking not found');
      }

      if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
        return commonHelper.forbidden(res, "You don't have access to this booking");
      }

      commonHelper.success(res, booking, 'Get booking detail successful');
    } catch (error) {
      console.log(error);
      commonHelper.error(res, error.message, 500);
    }
  },

  downloadTicket: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.booking_id);

      if (!booking) {
        return commonHelper.notFound(res, 'Booking not found');
      }

      if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
        return commonHelper.forbidden(res, "You don't have access to this ticket");
      }

      if (booking.payment_status !== 'paid') {
        return commonHelper.badRequest(res, 'Cannot download ticket. Payment not completed yet.');
      }

      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const filename = `ticket-${booking.booking_code}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f4eee6');
      doc.save();
      doc.roundedRect(80, 150, doc.page.width - 160, 35, 4).fill('#bfa2e8');
      doc.fillColor('#fff').fontSize(16).text('E-Ticket', 0, 160, { align: 'center' });
      doc.restore();

      const contentY = 200;
      doc.roundedRect(80, contentY, doc.page.width - 160, 430, 4).fill('#ffffff');

      let y = contentY + 20;
      const labelX = 100;

      function writeRow(label, value) {
        doc.font('Helvetica-Bold').fillColor('#000').fontSize(13).text(label, labelX, y);
        y += 18;
        doc.font('Helvetica').fillColor('#444').fontSize(13).text(value, labelX, y);
        y += 28;
      }

      writeRow('Booking Code :', booking.booking_code);
      writeRow('Package :', booking.package_name);
      writeRow('Date :', booking.departure_date);
      writeRow('Email :', booking.email);
      writeRow('Traveler :', booking.full_name || booking.fullname);

      doc
        .fillColor('#7b4ab8')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Please show this ticket upon arrival.', 0, 650, {
          align: 'center',
        });

      doc.end();
    } catch (error) {
      console.log(error);
      commonHelper.error(res, error.message, 500);
    }
  },

  cancelBooking: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.booking_id);

      if (!booking) {
        return commonHelper.notFound(res, 'Booking not found');
      }

      if (booking.user_id !== req.user.id) {
        return commonHelper.forbidden(res, "You don't have permission to cancel this booking");
      }

      if (booking.status === 'cancelled') {
        return commonHelper.badRequest(res, 'Booking already cancelled');
      }

      if (new Date(booking.departure_date) <= new Date()) {
        return commonHelper.badRequest(
          res,
          'Cannot cancel booking. Trip has already started or passed.'
        );
      }

      const updatedBooking = await Booking.cancel(req.params.booking_id, req.body.cancel_reason);

      commonHelper.success(res, updatedBooking, 'Booking cancelled successfully');
    } catch (error) {
      console.log(error);
      commonHelper.error(res, error.message, 500);
    }
  },

  createBooking: async (req, res) => {
    try {
      const { package_id, total_participants } = req.body;

      if (!package_id) {
        return commonHelper.badRequest(res, 'Package ID is required');
      }

      if (!total_participants || total_participants < 1) {
        return commonHelper.badRequest(res, 'Total participants must be at least 1');
      }

      const bookingData = {
        user_id: req.user.id,
        package_id: req.body.package_id,
        total_participants: req.body.total_participants,
        departure_date: req.body.departure_date,
        fullname: req.body.fullname,
        email: req.body.email,
        phone_number: req.body.phone_number,
        whatsapp_contact: req.body.whatsapp_contact,
        passport_number: req.body.passport_number,
        passport_expiry: req.body.passport_expiry,
        nationality: req.body.nationality,
        notes: req.body.notes,
        special_requests: req.body.special_requests,
        booking_passengers: req.body.booking_passengers || req.body.passenger_details,
        payment_method: req.body.payment_method,
      };

      const newBooking = await Booking.create(bookingData);

      commonHelper.created(res, newBooking, 'Booking created successfully');
    } catch (error) {
      console.log(error);

      if (error.message === 'PACKAGE_NOT_FOUND') {
        return commonHelper.notFound(res, 'Package not found');
      }
      if (error.message === 'QUOTA_FULL') {
        return commonHelper.badRequest(res, 'Package quota is full');
      }

      commonHelper.error(res, error.message, 500);
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

      commonHelper.paginated(
        res,
        result.data,
        {
          page,
          total_pages: Math.ceil(result.total / limit),
          total_items: result.total,
          per_page: limit,
        },
        'Get bookings successful'
      );
    } catch (error) {
      console.log(error);
      commonHelper.error(res, error.message, 500);
    }
  },

  getPaymentSummary: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.booking_id);

      if (!booking) {
        return commonHelper.notFound(res, 'Booking not found');
      }

      if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
        return commonHelper.forbidden(res, "You don't have access to this booking");
      }

      const paymentSummary = {
        booking: {
          booking_number: booking.booking_code,
          tour_name: booking.package_name,
          departure_date: booking.departure_date,
          total_participants: booking.total_participants,
        },
        passenger: {
          name: booking.fullname || booking.full_name,
          email: booking.email,
          phone: booking.phone_number,
        },
        payment: {
          base_price: booking.total_price,
          additional_fees: [],
          subtotal: booking.total_price,
          total_amount: booking.total_price,
          payment_status: booking.payment_status,
          payment_deadline: booking.payment_deadline,
        },
      };

      commonHelper.success(res, paymentSummary, 'Get payment summary successful');
    } catch (error) {
      console.log(error);
      commonHelper.error(res, error.message, 500);
    }
  },
};

module.exports = BookingController;
