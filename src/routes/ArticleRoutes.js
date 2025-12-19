const express = require("express");
const ArticleController = require("../controllers/ArticleController");
const AdminController = require("../controllers/AdminController");
const { protect, isAdmin } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: Article management endpoints for both users and admins
 */

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: Get all published articles
 *     description: Retrieve a paginated list of published articles with optional filters
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or content
 *         example: umroh
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *         example: Tips Travel
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, popular]
 *         description: Sort order (latest by date, popular by views)
 *         default: latest
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
 *         description: Articles retrieved successfully
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
 *                   example: Get articles successful
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
 *                         example: Tips Umroh Pertama Kali
 *                       tanggal:
 *                         type: string
 *                         example: 15 November 2024
 *                       preview:
 *                         type: string
 *                         example: Umroh merupakan ibadah yang sangat dianjurkan...
 *                       imageUrl:
 *                         type: string
 *                         example: https://cloudinary.com/article.jpg
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
router.get("/", ArticleController.getAll);

/**
 * @swagger
 * /articles/{id}:
 *   get:
 *     summary: Get article by ID
 *     description: Retrieve detailed article information including full content and sections
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Article ID or slug
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Article retrieved successfully
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
 *                   example: Get article successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     judul:
 *                       type: string
 *                       example: Tips Umroh Pertama Kali
 *                     tanggal:
 *                       type: string
 *                       example: 15 November 2024
 *                     content:
 *                       type: string
 *                       example: <p>Full HTML content...</p>
 *                     imageUrl:
 *                       type: string
 *                       example: https://cloudinary.com/article.jpg
 *                     sections:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: Persiapan Dokumen
 *                           content:
 *                             type: string
 *                             example: <p>Section content...</p>
 *                           imageUrl:
 *                             type: string
 *                             example: https://cloudinary.com/article.jpg
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Article not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", ArticleController.getById);

/**
 * @swagger
 * /articles:
 *   post:
 *     summary: Create new article (Admin only)
 *     description: Create a new article with title, content, and optional cover image
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - judul
 *               - content
 *             properties:
 *               judul:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 description: Article title
 *                 example: Tips Memilih Paket Umroh
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 50000
 *                 description: Article content (HTML format)
 *                 example: <p>Memilih paket umroh yang tepat...</p>
 *               tanggal:
 *                 type: string
 *                 format: date
 *                 description: Publication date
 *                 example: 2024-12-11
 *               cover_image:
 *                 type: string
 *                 format: binary
 *                 description: Cover image file (jpg, png, webp, max 3MB)
 *     responses:
 *       201:
 *         description: Article created successfully
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
 *                   example: Article created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     articleId:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *       400:
 *         description: Bad request - Validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post("/", protect, isAdmin, upload.single("cover_image"), AdminController.createArticle);

/**
 * @swagger
 * /articles/{id}:
 *   put:
 *     summary: Update article (Admin only)
 *     description: Update an existing article's title, content, date, or cover image
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Article ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               judul:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 description: Article title
 *                 example: Tips Memilih Paket Umroh (Updated)
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 50000
 *                 description: Article content (HTML format)
 *                 example: <p>Updated content...</p>
 *               tanggal:
 *                 type: string
 *                 format: date
 *                 description: Publication date
 *                 example: 2024-12-15
 *               cover_image:
 *                 type: string
 *                 format: binary
 *                 description: New cover image file (jpg, png, webp, max 3MB)
 *     responses:
 *       200:
 *         description: Article updated successfully
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
 *                   example: Article updated successfully
 *       400:
 *         description: Bad request - Validation error or no data to update
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Article not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", protect, isAdmin, upload.single("cover_image"), AdminController.updateArticle);

/**
 * @swagger
 * /articles/{id}:
 *   delete:
 *     summary: Delete article (Admin only)
 *     description: Permanently delete an article from the database
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Article ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Article deleted successfully
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
 *                   example: Article deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Article not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", protect, isAdmin, AdminController.deleteArticle);

/**
 * @swagger
 * /articles/{id}/publish:
 *   patch:
 *     summary: Toggle article publish status (Admin only)
 *     description: Toggle between published and draft status for an article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Article ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Article publish status toggled successfully
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
 *                   example: Article published successfully
 *                   description: Message varies - "Article published successfully" or "Article unpublished successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Article not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/publish", protect, isAdmin, AdminController.togglePublish);

module.exports = router;
