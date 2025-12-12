const express = require('express');
const AdminController = require('../controllers/AdminController');
const { protect, isAdmin } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.use(isAdmin);

/**
 * @swagger
 * tags:
 *   name: Admin Dashboard
 *   description: Admin dashboard statistics and analytics endpoints
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get dashboard statistics (admin only)
 *     description: Retrieve overall statistics including total bookings, profit, and active buyers
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
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
 *                   example: Get dashboard data successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalBooking:
 *                       type: integer
 *                       example: 125
 *                       description: Total number of paid bookings
 *                     profit:
 *                       type: number
 *                       format: float
 *                       example: 45000000.00
 *                       description: Total profit from paid bookings
 *                     pembeliAktif:
 *                       type: integer
 *                       example: 87
 *                       description: Number of active buyers
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/stats', protect, isAdmin, AdminController.getDashboardStats);

/**
 * @swagger
 * /admin/top-packages:
 *   get:
 *     summary: Get top performing packages (admin only)
 *     description: Retrieve the top 3 packages with the highest booking count
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top packages retrieved successfully
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
 *                   example: Get top packages successful
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: Paket Umroh Plus Turki
 *                         description: Package name
 *                       percentage:
 *                         type: integer
 *                         example: 100
 *                         description: Booking percentage relative to top package
 *                       imageUrl:
 *                         type: string
 *                         example: https://cloudinary.com/image.jpg
 *                         description: Package image URL
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/top-packages', protect, isAdmin, AdminController.getTopPackages);

/**
 * @swagger
 * /admin/top-buyers:
 *   get:
 *     summary: Get top buyers (admin only)
 *     description: Retrieve the top 6 buyers with highest booking count and reviews
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top buyers retrieved successfully
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
 *                   example: Get top buyers successful
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nama:
 *                         type: string
 *                         example: Siti Nurhaliza
 *                         description: Buyer full name
 *                       totalBooking:
 *                         type: integer
 *                         example: 5
 *                         description: Total number of paid bookings
 *                       totalUlasan:
 *                         type: integer
 *                         example: 3
 *                         description: Total number of reviews
 *                       profileImage:
 *                         type: string
 *                         example: https://cloudinary.com/avatar.jpg
 *                         description: User avatar URL
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/top-buyers', protect, isAdmin, AdminController.getTopBuyers);

/**
 * @swagger
 * /admin/booking-status:
 *   get:
 *     summary: Get booking status by continent (admin only)
 *     description: Retrieve booking count grouped by continent (Asia, Europe, Australia, Africa)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking status retrieved successfully
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
 *                   example: Get booking status successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     asia:
 *                       type: integer
 *                       example: 45
 *                       description: Number of bookings for Asia packages
 *                     eropa:
 *                       type: integer
 *                       example: 32
 *                       description: Number of bookings for Europe packages
 *                     australia:
 *                       type: integer
 *                       example: 15
 *                       description: Number of bookings for Australia packages
 *                     afrika:
 *                       type: integer
 *                       example: 8
 *                       description: Number of bookings for Africa packages
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/booking-status', protect, isAdmin, AdminController.getBookingStatus);

module.exports = router;