const express = require("express");
const PackageController = require("../controllers/PackageController");
const AdminController = require("../controllers/AdminController");
const { protect, isAdmin } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Packages
 *   description: Tour package management endpoints
 */

/**
 * @swagger
 * /packages:
 *   get:
 *     summary: Get all tour packages
 *     description: Retrieve a list of tour packages with optional filters
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by package name or location
 *         example: umroh turki
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location/country
 *         example: Turki
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Filter by departure month (format YYYY-MM)
 *         example: 2024-12
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
 *         description: Packages retrieved successfully
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
 *                   example: Get packages successful
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: 123e4567-e89b-12d3-a456-426614174000
 *                       name:
 *                         type: string
 *                         example: Paket Umroh Plus Turki
 *                       location:
 *                         type: string
 *                         example: Turki - Istanbul
 *                       price:
 *                         type: number
 *                         format: float
 *                         example: 35000000.00
 *                         description: Price per person
 *                       duration:
 *                         type: string
 *                         example: 12 Hari
 *                       departureDate:
 *                         type: string
 *                         format: date
 *                         example: 2024-12-25
 *                       imageUrl:
 *                         type: string
 *                         example: https://cloudinary.com/package.jpg
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/", PackageController.getAll);

/**
 * @swagger
 * /packages/{id}:
 *   get:
 *     summary: Get package detail
 *     description: Retrieve detailed information for a specific tour package
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Package ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Package detail retrieved successfully
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
 *                   example: Get package successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Paket Umroh Plus Turki
 *                     location:
 *                       type: string
 *                       example: Turki - Istanbul
 *                     benua:
 *                       type: string
 *                       example: Asia
 *                       description: Continent
 *                     maskapai:
 *                       type: string
 *                       example: Turkish Airlines
 *                       description: Airline
 *                     bandara:
 *                       type: string
 *                       example: Soekarno-Hatta
 *                       description: Departure airport
 *                     periode:
 *                       type: string
 *                       example: 25 Desember
 *                       description: Departure period
 *                     harga:
 *                       type: number
 *                       format: float
 *                       example: 35000000.00
 *                       description: Price per person
 *                     imageUrl:
 *                       type: string
 *                       example: https://cloudinary.com/package.jpg
 *                     itinerary:
 *                       type: object
 *                       description: Day-by-day itinerary (JSON object)
 *                       example:
 *                         day1:
 *                           title: "Hari 1 - Keberangkatan"
 *                           activities: ["Check-in", "Penerbangan"]
 *                         day2:
 *                           title: "Hari 2 - Tiba di Istanbul"
 *                           activities: ["City tour", "Hotel check-in"]
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Package not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", PackageController.getPackageDetail);

/**
 * @swagger
 * /packages:
 *   post:
 *     summary: Create new package
 *     description: Create a new tour package with image upload
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - harga
 *             properties:
 *               name:
 *                 type: string
 *                 description: Package name
 *                 example: Paket Umroh Plus Turki 12 Hari
 *               location:
 *                 type: string
 *                 description: Location/destination
 *                 example: Turki
 *               benua:
 *                 type: string
 *                 description: Continent
 *                 enum: [Asia, Eropa, Australia, Afrika, Amerika]
 *                 example: Eropa
 *               harga:
 *                 type: number
 *                 format: float
 *                 description: Package price
 *                 example: 35000000
 *               periode:
 *                 type: string
 *                 format: date
 *                 description: Period date
 *                 example: 2024-12-01
 *               maskapai:
 *                 type: string
 *                 description: Airline name
 *                 example: Turkish Airlines
 *               bandara:
 *                 type: string
 *                 description: Airport name
 *                 example: Soekarno-Hatta International Airport
 *               itinerary:
 *                 type: string
 *                 description: Itinerary in JSON string format
 *                 example: '{"day1": "Departure from Jakarta", "day2": "Arrive in Istanbul"}'
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Package image file (jpg, png, webp, max 3MB)
 *     responses:
 *       201:
 *         description: Package created successfully
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
 *                   example: Package created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     name:
 *                       type: string
 *                       example: Paket Umroh Plus Turki 12 Hari
 *                     location:
 *                       type: string
 *                       example: Turki
 *                     benua:
 *                       type: string
 *                       example: Eropa
 *                     harga:
 *                       type: number
 *                       format: float
 *                       example: 35000000
 *                     periode:
 *                       type: string
 *                       format: date
 *                       example: 2024-12-01
 *                     maskapai:
 *                       type: string
 *                       example: Turkish Airlines
 *                     bandara:
 *                       type: string
 *                       example: Soekarno-Hatta International Airport
 *                     itinerary:
 *                       type: object
 *                       example: {"day1": "Departure from Jakarta", "day2": "Arrive in Istanbul"}
 *                     image:
 *                       type: string
 *                       example: https://cloudinary.com/packages/image.jpg
 *                       description: Uploaded image URL
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - name and harga are required, or invalid file format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       413:
 *         description: Payload too large - Image exceeds 3MB
 *       500:
 *         description: Internal server error
 */
router.post("/", protect, isAdmin, upload.single("image"), AdminController.createPackage);

/**
 * @swagger
 * /packages/{id}:
 *   put:
 *     summary: Update package (Admin only)
 *     description: Update an existing tour package's details
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Package ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Package name
 *                 example: Paket Umroh Plus Turki (Updated)
 *               location:
 *                 type: string
 *                 description: Location/destination
 *                 example: Turki - Istanbul & Bursa
 *               benua:
 *                 type: string
 *                 description: Continent
 *                 example: Asia
 *               maskapai:
 *                 type: string
 *                 description: Airline name
 *                 example: Turkish Airlines
 *               bandara:
 *                 type: string
 *                 description: Departure airport
 *                 example: Soekarno-Hatta
 *               periode:
 *                 type: string
 *                 format: date
 *                 description: Departure date
 *                 example: 2024-12-30
 *               harga:
 *                 type: number
 *                 format: float
 *                 description: Price per person
 *                 example: 38000000.00
 *               itinerary:
 *                 type: string
 *                 description: Updated itinerary (JSON string)
 *                 example: '{"day1":{"title":"Updated"}}'
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New package image (jpg, png, webp, max 3MB)
 *     responses:
 *       200:
 *         description: Package updated successfully
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
 *                   example: Package updated successfully
 *       400:
 *         description: Bad request - No data to update
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Package not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", protect, isAdmin, upload.single("image"), AdminController.updatePackage);

/**
 * @swagger
 * /packages/{id}:
 *   delete:
 *     summary: Delete package (Admin only)
 *     description: Permanently delete a tour package from the database
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Package ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Package deleted successfully
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
 *                   example: Package deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Package not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", protect, isAdmin, AdminController.deletePackage);

module.exports = router;
