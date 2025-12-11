const express = require('express');
const PaymentController = require('../controllers/PaymentController');
const { protect, isAdmin } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/upload');

const router = express.Router();

router.get('/:booking_id', protect, PaymentController.getPaymentDetail);
router.put('/:booking_id/proof', protect, uploadImage.single('payment_proof'), PaymentController.uploadPaymentProof);

router.patch('/:booking_id/status', protect, isAdmin, PaymentController.updatePaymentStatus);

module.exports = router;