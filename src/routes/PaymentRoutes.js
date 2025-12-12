const express = require('express');
const PaymentController = require('../controllers/PaymentController');
const AdminController = require('../controllers/AdminController');
const { protect, isAdmin } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management endpoints for bookings
 */

/**
 * @swagger
 * /payments/{booking_id}:
 *   get:
 *     summary: Get payment detail
 *     description: Retrieve payment information for a specific booking
 *     tags: [Payments]
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
 *         description: Payment detail retrieved successfully
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
 *                   example: Get payment detail successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 456e7890-f12a-34b5-c678-901234567890
 *                     booking_id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     base_price:
 *                       type: number
 *                       format: float
 *                       example: 35000000.00
 *                       description: Base package price
 *                     additional_fees:
 *                       type: number
 *                       format: float
 *                       example: 500000.00
 *                       description: Additional fees (if any)
 *                     total_amount:
 *                       type: number
 *                       format: float
 *                       example: 35500000.00
 *                       description: Total amount to be paid
 *                     payment_status:
 *                       type: string
 *                       enum: [unpaid, pending, paid, refunded, failed]
 *                       example: pending
 *                     payment_method:
 *                       type: string
 *                       example: bank_transfer
 *                       description: Payment method used
 *                     payment_proof_url:
 *                       type: string
 *                       example: https://cloudinary.com/payment-proof.jpg
 *                       description: URL of payment proof image
 *                     payment_deadline:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-12-18T23:59:59Z
 *                       description: Payment deadline
 *                     paid_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-12-11T15:30:00Z
 *                       description: Payment completion timestamp
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not authorized to access this payment
 *       404:
 *         description: Payment or booking not found
 *       500:
 *         description: Internal server error
 */
router.get('/:booking_id', protect, PaymentController.getPaymentDetail);

/**
 * @swagger
 * /payments/{booking_id}/status:
 *   patch:
 *     summary: Update payment status (Admin only)
 *     description: Update payment status after verification (approve or reject)
 *     tags: [Payments]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_status
 *             properties:
 *               payment_status:
 *                 type: string
 *                 enum: [paid, failed, refunded]
 *                 description: New payment status
 *                 example: paid
 *     responses:
 *       200:
 *         description: Payment status updated successfully
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
 *                   example: Payment updated successfully
 *       400:
 *         description: Bad request - Invalid payment status
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Payment or booking not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:booking_id/status', protect, isAdmin, AdminController.updatePaymentStatus);

module.exports = router;