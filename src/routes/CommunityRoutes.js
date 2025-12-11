const express = require('express');
const CommunityController = require('../controllers/CommunityController');
const { protect, isAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, CommunityController.getAll);
router.get('/:id', protect, CommunityController.getById);
router.post('/', protect, CommunityController.createPost);
router.put('/:id', protect, CommunityController.updatePost);
router.delete('/:id', protect, CommunityController.deletePost);

router.delete('/:id/admin', protect, isAdmin, CommunityController.adminDeletePost);

module.exports = router;