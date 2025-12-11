const express = require('express');
const KomunitasController = require('../controllers/KomunitasController');
const { protect, isAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/admin', protect, isAdmin, KomunitasController.getAllAdmin);

router.get('/', protect, KomunitasController.getAll);
router.get('/:id', protect, KomunitasController.getById);

router.get('/:komunitas_id/comments', protect, KomunitasController.getComments);
router.post('/:komunitas_id/comments', protect, KomunitasController.addComment);

module.exports = router;