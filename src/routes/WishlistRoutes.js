const express = require('express');
const WishlistController = require('../controllers/WishlistController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wishlists
 *   description: Wishlist management endpoints for tour packages
 */

/**
 * @swagger
 * /wishlists:
 *   get:
 *     summary: Get user wishlist
 *     description: Retrieve all tour packages in the authenticated user's wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
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
 *                   example: Get wishlist successful
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: 123e4567-e89b-12d3-a456-426614174000
 *                         description: Wishlist item ID
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-12-11T10:30:00Z
 *                         description: When item was added to wishlist
 *                       tour_package:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: 456e7890-f12a-34b5-c678-901234567890
 *                           title:
 *                             type: string
 *                             example: Paket Umroh Plus Turki
 *                           destination_country:
 *                             type: string
 *                             example: Turki
 *                           price_per_pax:
 *                             type: number
 *                             format: float
 *                             example: 35000000.00
 *                             description: Price per person
 *                           thumbnail_url:
 *                             type: string
 *                             example: https://cloudinary.com/package.jpg
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/', protect, WishlistController.getByUser);

/**
 * @swagger
 * /wishlists:
 *   post:
 *     summary: Add package to wishlist
 *     description: Add a tour package to the user's wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tour_package_id
 *             properties:
 *               tour_package_id:
 *                 type: string
 *                 format: uuid
 *                 description: Tour package ID to add to wishlist
 *                 example: 456e7890-f12a-34b5-c678-901234567890
 *     responses:
 *       201:
 *         description: Package added to wishlist successfully
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
 *                   example: Added to wishlist
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                       description: Wishlist item ID
 *                     tour_package_id:
 *                       type: string
 *                       format: uuid
 *                       example: 456e7890-f12a-34b5-c678-901234567890
 *       400:
 *         description: Bad request - tour_package_id is required or package already in wishlist
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Tour package not found
 *       500:
 *         description: Internal server error
 */
router.post('/', protect, WishlistController.addToWishlist);

/**
 * @swagger
 * /wishlists/{id}:
 *   delete:
 *     summary: Remove package from wishlist
 *     description: Remove a tour package from the user's wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Wishlist item ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Package removed from wishlist successfully
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
 *                   example: Removed from wishlist
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not authorized to remove this wishlist item
 *       404:
 *         description: Wishlist item not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', protect, WishlistController.removeFromWishlist);

module.exports = router;