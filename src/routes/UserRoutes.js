const express = require('express');
const UserController = require('../controllers/UserController');
const AdminController = require('../controllers/AdminController');
const { protect, isAdmin } = require('../middlewares/auth');
const { uploadAvatar } = require('../middlewares/upload');
const { uploadLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/forgot-password', UserController.forgotPassword);
router.post('/reset-password', UserController.resetPassword);
router.post('/logout', protect, UserController.logout);

router.get('/profile', protect, UserController.getProfile);
router.put('/profile', protect, UserController.updateProfile);
router.post(
  '/profile/avatar',
  protect,
  uploadLimiter,
  uploadAvatar.single('avatar'),
  UserController.uploadAvatar
);
router.delete('/profile/avatar', protect, UserController.deleteAvatar);

router.get('/', protect, isAdmin, AdminController.getAllUsers);
router.get('/:id', protect, isAdmin, AdminController.getUserDetail);
router.post('/', protect, isAdmin, AdminController.createUser);
router.put('/:id', protect, isAdmin, AdminController.updateUser);
router.delete('/:id', protect, isAdmin, AdminController.deleteUser);

module.exports = router;