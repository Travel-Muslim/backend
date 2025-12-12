const express = require('express');
const UserController = require('../controllers/UserController');
const AdminController = require('../controllers/AdminController');
const { protect, isAdmin } = require('../middlewares/auth');
const { upload } = require("../middlewares/upload");


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User authentication and profile management endpoints
 */

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Register new user
 *     description: Create a new user account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *               - email
 *               - noTelepon
 *               - password
 *               - konfirmasiPassword
 *               - setujuKebijakan
 *             properties:
 *               nama:
 *                 type: string
 *                 description: Full name
 *                 example: Siti Nurhaliza
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *                 example: siti@example.com
 *               noTelepon:
 *                 type: string
 *                 description: Phone number
 *                 example: 08123456789
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Password (minimum 6 characters)
 *                 example: password123
 *               konfirmasiPassword:
 *                 type: string
 *                 format: password
 *                 description: Password confirmation
 *                 example: password123
 *               setujuKebijakan:
 *                 type: boolean
 *                 description: Must agree to privacy policy
 *                 example: true
 *     responses:
 *       201:
 *         description: Registration successful
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
 *                   example: Register successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                       description: JWT authentication token
 *       400:
 *         description: Bad request - Validation error or passwords don't match
 *       403:
 *         description: Email already registered
 *       500:
 *         description: Internal server error
 */
router.post('/register', UserController.register);

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and receive JWT token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email
 *                 example: siti@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     nama:
 *                       type: string
 *                       example: Siti Nurhaliza
 *                     email:
 *                       type: string
 *                       example: siti@example.com
 *                     role:
 *                       type: string
 *                       enum: [user, admin]
 *                       example: user
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     profileImage:
 *                       type: string
 *                       example: https://cloudinary.com/avatar.jpg
 *       403:
 *         description: Invalid email or password
 *       500:
 *         description: Internal server error
 */
router.post('/login', UserController.login);

/**
 * @swagger
 * /user/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Generate a password reset token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email
 *                 example: siti@example.com
 *     responses:
 *       200:
 *         description: Reset token generated successfully
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
 *                   example: Reset token generated
 *                 data:
 *                   type: object
 *                   properties:
 *                     resetToken:
 *                       type: string
 *                       format: uuid
 *                       example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *                       description: Use this token to reset password
 *       404:
 *         description: Email not found
 *       500:
 *         description: Internal server error
 */
router.post('/forgot-password', UserController.forgotPassword);

/**
 * @swagger
 * /user/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset user password using reset token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 format: uuid
 *                 description: Reset token from forgot-password endpoint
 *                 example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: New password
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successful
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
 *                   example: Password berhasil direset
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', UserController.resetPassword);

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: User logout
 *     description: Logout current user session
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logout successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/logout', protect, UserController.logout);

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve authenticated user profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                   example: Get profile successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     nama:
 *                       type: string
 *                       example: Siti Nurhaliza
 *                     email:
 *                       type: string
 *                       example: siti@example.com
 *                     noTelepon:
 *                       type: string
 *                       example: 08123456789
 *                     profileImage:
 *                       type: string
 *                       example: https://cloudinary.com/avatar.jpg
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/profile', protect, UserController.getProfile);

/**
 * @swagger
 * /user/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update authenticated user profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *                 description: Full name
 *                 example: Siti Nurhaliza Updated
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *                 example: siti.updated@example.com
 *               noTelepon:
 *                 type: string
 *                 description: Phone number
 *                 example: 08198765432
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: New password (optional)
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: Profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     nama:
 *                       type: string
 *                     email:
 *                       type: string
 *                     noTelepon:
 *                       type: string
 *                     profileImage:
 *                       type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.put('/profile', protect, UserController.updateProfile);

/**
 * @swagger
 * /user/profile/avatar:
 *   post:
 *     summary: Upload avatar
 *     description: Upload or update user profile avatar image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (jpg, png, webp, max 2MB)
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
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
 *                   example: Avatar uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatarUrl:
 *                       type: string
 *                       example: https://cloudinary.com/avatar.jpg
 *       400:
 *         description: Bad request - No file uploaded or invalid file format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.put("/profile/avatar", protect, upload.single("avatar"), UserController.uploadAvatar);

/**
 * @swagger
 * /user/profile/avatar:
 *   delete:
 *     summary: Delete avatar
 *     description: Remove user profile avatar image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
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
 *                   example: Avatar deleted successfully
 *       400:
 *         description: No avatar to delete
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.delete('/profile/avatar', protect, UserController.deleteAvatar);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Retrieve a list of all users with pagination and search
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *         example: siti
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
 *         description: Users retrieved successfully
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
 *                   example: Get users successful
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       namaLengkap:
 *                         type: string
 *                         example: Siti Nurhaliza
 *                       email:
 *                         type: string
 *                         example: siti@example.com
 *                       telepon:
 *                         type: string
 *                         example: 08123456789
 *                       password:
 *                         type: string
 *                         example: "******"
 *                       tanggalDaftar:
 *                         type: string
 *                         example: "11/12/2024 10:30"
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
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/', protect, isAdmin, AdminController.getAllUsers);

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     description: Retrieve detailed information for a specific user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                   example: Get user successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     namaLengkap:
 *                       type: string
 *                       example: Siti Nurhaliza
 *                     email:
 *                       type: string
 *                       example: siti@example.com
 *                     password:
 *                       type: string
 *                       example: "******"
 *                     nomorTelepon:
 *                       type: string
 *                       example: 08123456789
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', protect, isAdmin, AdminController.getUserDetail);

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     description: Update an existing user's information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               namaLengkap:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Full name
 *                 example: Ahmad Abdullah Updated
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *                 example: ahmad.updated@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: New password
 *                 example: newpassword123
 *               nomorTelepon:
 *                 type: string
 *                 description: Phone number
 *                 example: 08198765432
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   example: User updated successfully
 *       400:
 *         description: Bad request - Validation error or no data to update
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', protect, isAdmin, AdminController.updateUser);

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     description: Permanently delete a user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: User deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', protect, isAdmin, AdminController.deleteUser);

module.exports = router;