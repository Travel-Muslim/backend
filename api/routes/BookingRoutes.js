const express = require('express');
const BookingController = require('../controllers/BookingController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management endpoints for tour packages
 */

/**
 * @swagger
 * /bookings/active:
 *   get:
 *     summary: Get active bookings
 *     description: Retrieve all active bookings for the authenticated user (status confirmed or pending)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *         default: 10
 *     responses:
 *       200:
 *         description: Active bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Get active bookings successful
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: 123e4567-e89b-12d3-a456-426614174000
 *                       booking_code:
 *                         type: string
 *                         example: BKG-2024-001
 *                       package_name:
 *                         type: string
 *                         example: Paket Umroh Plus Turki
 *                       departure_date:
 *                         type: string
 *                         format: date
 *                         example: 2024-12-25
 *                       status:
 *                         type: string
 *                         enum: [pending, confirmed, cancelled, completed]
 *                         example: confirmed
 *                       total_price:
 *                         type: number
 *                         format: float
 *                         example: 35000000.00
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     per_page:
 *                       type: integer
 *                       example: 10
 *                     total_pages:
 *                       type: integer
 *                       example: 3
 *                     total_items:
 *                       type: integer
 *                       example: 25
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/active", protect, BookingController.getActiveBookings);

/**
 * @swagger
 * /bookings/{booking_id}/download-ticket:
 *   get:
 *     summary: Download booking ticket
 *     description: Download booking ticket as PDF (only available for paid bookings)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: booking_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Ticket PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad request - Payment not completed yet
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not authorized to access this ticket
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 */
router.get("/:booking_id/download-ticket", protect, BookingController.downloadTicket);

/**
 * @swagger
 * /bookings/history:
 *   get:
 *     summary: Get booking history
 *     description: Retrieve booking history for the authenticated user (completed or cancelled)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *         default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, cancelled]
 *         description: Filter by booking status
 *     responses:
 *       200:
 *         description: Booking history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Get booking history successful
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: 123e4567-e89b-12d3-a456-426614174000
 *                       booking_code:
 *                         type: string
 *                         example: BKG-2024-001
 *                       package_name:
 *                         type: string
 *                         example: Paket Umroh Plus Turki
 *                       departure_date:
 *                         type: string
 *                         format: date
 *                         example: 2024-11-15
 *                       status:
 *                         type: string
 *                         enum: [completed, cancelled]
 *                         example: completed
 *                       total_price:
 *                         type: number
 *                         format: float
 *                         example: 35000000.00
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     per_page:
 *                       type: integer
 *                       example: 10
 *                     total_pages:
 *                       type: integer
 *                       example: 2
 *                     total_items:
 *                       type: integer
 *                       example: 18
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/history", protect, BookingController.getBookingHistory);

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get bookings with filters
 *     description: Retrieve all bookings for authenticated user with advanced filtering options
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *         default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *         description: Filter by booking status
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter bookings from this departure date
 *         example: 2024-12-01
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter bookings until this departure date
 *         example: 2024-12-31
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by destination or package name
 *         example: Turki
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Get bookings successful
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       booking_code:
 *                         type: string
 *                       departure_date:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                       total_price:
 *                         type: number
 *                         format: float
 *                       package_name:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                     total_items:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/", protect, BookingController.getBookingsWithFilter);

/**
 * @swagger
 * /bookings/{booking_id}:
 *   get:
 *     summary: Get booking detail
 *     description: Retrieve detailed information for a specific booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: booking_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Booking detail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Get booking detail successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     booking_code:
 *                       type: string
 *                       example: BKG-2024-001
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     package_id:
 *                       type: string
 *                       format: uuid
 *                     booking_date:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-12-11T10:30:00Z
 *                     departure_date:
 *                       type: string
 *                       format: date
 *                       example: 2024-12-25
 *                     total_participants:
 *                       type: integer
 *                       example: 2
 *                     total_price:
 *                       type: number
 *                       format: float
 *                       example: 35000000.00
 *                     status:
 *                       type: string
 *                       enum: [pending, confirmed, cancelled, completed]
 *                       example: confirmed
 *                     payment_status:
 *                       type: string
 *                       enum: [unpaid, paid, refunded, failed]
 *                       example: paid
 *                     fullname:
 *                       type: string
 *                       example: Siti Nurhaliza
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: siti@example.com
 *                     phone_number:
 *                       type: string
 *                       example: 08123456789
 *                     whatsapp_contact:
 *                       type: string
 *                       example: 08123456789
 *                     passport_number:
 *                       type: string
 *                       example: A12345678
 *                     passport_expiry:
 *                       type: string
 *                       format: date
 *                       example: 2029-12-31
 *                     nationality:
 *                       type: string
 *                       example: Indonesia
 *                     notes:
 *                       type: string
 *                       example: Prefer window seat
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not authorized to access this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 */
router.get("/:booking_id", protect, BookingController.getBookingDetail);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create new booking
 *     description: Create a new tour package booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - package_id
 *               - departure_date
 *               - total_participants
 *               - fullname
 *               - email
 *               - phone_number
 *             properties:
 *               package_id:
 *                 type: string
 *                 format: uuid
 *                 description: Tour package ID
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               departure_date:
 *                 type: string
 *                 format: date
 *                 description: Departure date
 *                 example: 2024-12-25
 *               total_participants:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of participants
 *                 example: 2
 *               fullname:
 *                 type: string
 *                 description: Full name of main participant
 *                 example: Siti Nurhaliza
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *                 example: siti@example.com
 *               phone_number:
 *                 type: string
 *                 description: Phone number
 *                 example: 08123456789
 *               whatsapp_contact:
 *                 type: string
 *                 description: WhatsApp number (optional)
 *                 example: 08123456789
 *               passport_number:
 *                 type: string
 *                 description: Passport number (optional)
 *                 example: A12345678
 *               passport_expiry:
 *                 type: string
 *                 format: date
 *                 description: Passport expiry date (optional)
 *                 example: 2029-12-31
 *               nationality:
 *                 type: string
 *                 description: Nationality
 *                 default: Indonesia
 *                 example: Indonesia
 *               notes:
 *                 type: string
 *                 description: Additional notes or requests
 *                 example: Prefer halal food only
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Booking created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     booking_code:
 *                       type: string
 *                       example: BKG-2024-001
 *                     total_price:
 *                       type: number
 *                       format: float
 *                       example: 35000000.00
 *                     status:
 *                       type: string
 *                       example: pending
 *                     payment_status:
 *                       type: string
 *                       example: unpaid
 *       400:
 *         description: Bad request - Validation error or quota full
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Package not found
 *       500:
 *         description: Internal server error
 */
router.post("/", protect, BookingController.createBooking);

/**
 * @swagger
 * /bookings/{booking_id}/cancel:
 *   patch:
 *     summary: Cancel booking
 *     description: Cancel an existing booking (must be done before departure date)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: booking_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancel_reason:
 *                 type: string
 *                 description: Reason for cancellation
 *                 example: Change of plans
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Booking cancelled successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     booking_code:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: cancelled
 *                     cancel_reason:
 *                       type: string
 *                     cancelled_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Cannot cancel (trip started or already cancelled)
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not authorized to cancel this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:booking_id/cancel", protect, BookingController.cancelBooking);

module.exports = router;