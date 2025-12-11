const express = require('express');
const ArticleController = require('../controllers/ArticleController');
const { protect, isAdmin } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/upload');

const router = express.Router();

router.get('/', protect, ArticleController.getAll);
router.get('/:id', protect, ArticleController.getById);
router.put('/:id/view', protect, ArticleController.incrementView);

router.post('/', protect, isAdmin, uploadImage.single('cover_image'), ArticleController.createArticle);
router.put('/:id', protect, isAdmin, uploadImage.single('cover_image'), ArticleController.updateArticle);
router.delete('/:id', protect, isAdmin, ArticleController.deleteArticle);
router.patch('/:id/publish', protect, isAdmin, ArticleController.togglePublish);

module.exports = router;