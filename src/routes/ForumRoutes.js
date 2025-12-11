const express = require('express');
const ForumController = require('../controllers/ForumController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/stats', protect, ForumController.getStatistics);
router.get('/', protect, ForumController.getAll);
router.post('/', protect, ForumController.createTopic);
router.get('/:id', protect, ForumController.getById);
router.put('/:id', protect, ForumController.updateTopic);
router.delete('/:id', protect, ForumController.deleteTopic);
router.post('/:id/comments', protect, ForumController.createComment);
router.delete('/:id/comments/:comment_id', protect, ForumController.deleteComment);

module.exports = router;