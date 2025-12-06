const express = require('express');
const DestinationController = require('../controllers/DestinationController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, DestinationController.getAll);

router.get('/:id', protect, DestinationController.getById);

module.exports = router;