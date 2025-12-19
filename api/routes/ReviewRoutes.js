const express = require("express");
const ReviewController = require("../controllers/ReviewController");
const { protect } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review and rating management endpoints for tour packages
 */

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Get user reviews
 *     description: Retrieve all reviews created by the authenticated user
 *     tags: [Reviews]
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
 *         description: Reviews retrieved successfully
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
 *                   example: Get reviews successful
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: 123e4567-e89b-12d3-a456-426614174000
 *                       rating:
 *                         type: number
 *                         format: float
 *                         minimum: 1
 *                         maximum: 5
 *                         example: 4.5
 *                         description: Rating score (1.0 - 5.0)
 *                       comment:
 *                         type: string
 *                         example: Pengalaman umroh yang sangat berkesan
 *                       is_published:
 *                         type: boolean
 *                         example: false
 *                         description: Moderation status (published after admin approval)
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-12-11T10:30:00Z
 *                       tour_package:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             example: Paket Umroh Plus Turki
 *                       media:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             media_url:
 *                               type: string
 *                               example: https://cloudinary.com/review-photo.jpg
 *                             media_type:
 *                               type: string
 *                               example: image
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/", ReviewController.getAll);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create review
 *     description: Create a review for a completed booking (can only review once per booking)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *               - rating
 *               - comment
 *             properties:
 *               booking_id:
 *                 type: string
 *                 format: uuid
 *                 description: Booking ID to review (must be completed)
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               rating:
 *                 type: number
 *                 format: float
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating score (1.0 - 5.0)
 *                 example: 4.5
 *               comment:
 *                 type: string
 *                 description: Review comment
 *                 example: Pengalaman umroh yang sangat berkesan, tour guide sangat membantu
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 photos/media files (jpg, png, max 3MB each)
 *                 maxItems: 5
 *     responses:
 *       201:
 *         description: Review submitted for moderation
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
 *                   example: Review submitted for moderation
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     rating:
 *                       type: number
 *                       format: float
 *                       example: 4.5
 *                     is_published:
 *                       type: boolean
 *                       example: false
 *                       description: Reviews require admin approval before publishing
 *       400:
 *         description: Bad request - Required fields missing, invalid rating, already reviewed, or booking not completed
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not authorized to review this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 */
router.post("/", protect, upload.array("media", 5), ReviewController.createReview);

module.exports = router;
