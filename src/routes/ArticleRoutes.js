const express = require('express');
const ArticleController = require('../controllers/ArticleController');
const AdminController = require('../controllers/AdminController');
const { protect, isAdmin } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/upload');

const router = express.Router();

router.get('/', protect, ArticleController.getAll);
router.get('/:id', protect, ArticleController.getById);
router.put('/:id/view', protect, ArticleController.incrementView);

router.post('/', protect, isAdmin, uploadImage.single('cover_image'), AdminController.createArticle);
router.put('/:id', protect, isAdmin, uploadImage.single('cover_image'), AdminController.updateArticle);
router.delete('/:id', protect, isAdmin, AdminController.deleteArticle);
router.patch('/:id/publish', protect, isAdmin, AdminController.togglePublish);

module.exports = router;