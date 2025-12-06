const express = require('express');
const ArticleController = require('../controllers/ArticleController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, ArticleController.getAll);

router.get('/categories', protect, ArticleController.getCategories);

router.get('/:id_or_slug', protect, ArticleController.getById);

router.post('/:id/view', ArticleController.incrementView);

module.exports = router;