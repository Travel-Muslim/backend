const express = require("express");
const router = express.Router();

const KomunitasController = require("../controllers/KomunitasController");
const { protect } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Komunitas
 *   description: Community endpoints for discussions and comments
 */

/**
 * @swagger
 * /komunitas:
 *   get:
 *     summary: Get all community discussions
 *     description: Retrieve all community posts/discussions
 *     tags: [Komunitas]
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
 *         description: Community discussions retrieved successfully
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
 *                   example: Get komunitas successful
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: 123e4567-e89b-12d3-a456-426614174000
 *                       judul:
 *                         type: string
 *                         example: Diskusi Persiapan Umroh
 *                       deskripsi:
 *                         type: string
 *                         example: Mari berbagi tips persiapan umroh
 *                       total_comments:
 *                         type: integer
 *                         example: 15
 *                         description: Total number of comments
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-12-11T10:30:00Z
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
 *                       example: 5
 *                     total_items:
 *                       type: integer
 *                       example: 48
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/", protect, KomunitasController.getAll);

/**
 * @swagger
 * /komunitas:
 *   post:
 *     summary: Create new community post
 *     description: User creates a new post/discussion in community
 *     tags: [Komunitas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - judul
 *               - komentar
 *               - rating
 *             properties:
 *               judul:
 *                 type: string
 *                 description: Post title
 *                 example: Pengalaman Umroh Desember 2024
 *               tanggal:
 *                 type: string
 *                 format: date
 *                 description: Post date (optional, defaults to current date)
 *                 example: 2024-12-10
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating (1-5 stars)
 *                 example: 5
 *               komentar:
 *                 type: string
 *                 description: Post content/comment
 *                 example: Alhamdulillah pengalaman umroh sangat berkesan. Pelayanan sangat baik dan memuaskan!
 *     responses:
 *       201:
 *         description: Post created successfully
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
 *                   example: Comment added successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 456e7890-f12a-34b5-c678-901234567890
 *                     judul:
 *                       type: string
 *                       example: Pengalaman Umroh Desember 2024
 *                     deskripsi:
 *                       type: string
 *                       example: Alhamdulillah pengalaman umroh sangat berkesan
 *                     rating:
 *                       type: integer
 *                       example: 5
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-12-10T08:30:00.000Z
 *       400:
 *         description: Bad request - Required fields missing or rating invalid (must be 1-5)
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post("/", protect, KomunitasController.addComment);

module.exports = router;