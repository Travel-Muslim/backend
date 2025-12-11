const express = require('express');
const UserController = require('../controllers/UserController');
const { protect, isAdmin } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/upload');
const { uploadLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/forgot-password', UserController.forgotPassword);
router.post('/reset-password', UserController.resetPassword);

router.post('/logout', protect, UserController.logout);
router.get('/profile', protect, UserController.getProfile);
router.put('/profile', protect, UserController.updateProfile);
router.post('/profile/avatar', protect, uploadLimiter, uploadImage.single('avatar'), UserController.uploadAvatar);
router.delete('/profile/avatar', protect, UserController.deleteAvatar);

router.get('/', protect, isAdmin, UserController.getAllUsers);
router.get('/:id', protect, isAdmin, UserController.getUserDetail);
router.post('/', protect, isAdmin, UserController.createUser);
router.put('/:id', protect, isAdmin, UserController.updateUser);
router.delete('/:id', protect, isAdmin, UserController.deleteUser);

module.exports = router;