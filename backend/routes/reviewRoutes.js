const express = require('express');
const router = express.Router();
const {
	createReview,
	getFoodReviews,
	getOrderReview,
	getMyOrderReviews,
	getAllReviews,
	replyToReview,
	deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const reviewUpload = uploadImage('reviews');
const { admin } = require('../middleware/adminMiddleware');

router.post(
	'/',
	protect,
	reviewUpload.fields([
		{ name: 'foodPhoto', maxCount: 1 },
		{ name: 'feedbackImages', maxCount: 4 },
	]),
	createReview
);
router.get('/food/:id', getFoodReviews);
router.get('/order/:id', protect, getOrderReview);
router.get('/my-orders', protect, getMyOrderReviews);
router.get('/', protect, admin, getAllReviews);
router.put('/:id/reply', protect, admin, replyToReview);
router.delete('/:id', protect, admin, deleteReview);

module.exports = router;
