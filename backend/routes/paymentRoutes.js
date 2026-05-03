const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/adminMiddleware');
const { uploadImage } = require('../middleware/upload');
const {
	getPaymentConfig,
	createStripeCheckoutSession,
	verifyStripeCheckoutSession,
	createPayment,
	getMyPayments,
	getAllPayments,
	getPayment,
	updatePayment,
	deletePayment,
} = require('../controllers/paymentController');

const paymentUpload = uploadImage('payments');

router.get('/config', getPaymentConfig);
router.post('/stripe/create-checkout-session', protect, createStripeCheckoutSession);
router.get('/stripe/verify/:sessionId', protect, verifyStripeCheckoutSession);

router.post('/', protect, paymentUpload.single('receipt'), createPayment);
router.get('/', protect, getMyPayments);
router.get('/all', protect, admin, getAllPayments);
router.get('/:id', protect, getPayment);
router.put('/:id', protect, paymentUpload.single('receipt'), updatePayment);
router.delete('/:id', protect, admin, deletePayment);

module.exports = router;
