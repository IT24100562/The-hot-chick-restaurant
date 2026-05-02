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
const { admin } = require('../middleware/adminMiddleware');

router.post('/', protect, createReview);
router.get('/food/:id', getFoodReviews);
router.get('/order/:id', protect, getOrderReview);
router.get('/my-orders', protect, getMyOrderReviews);
router.get('/', protect, admin, getAllReviews);
router.put('/:id/reply', protect, admin, replyToReview);
router.delete('/:id', protect, admin, deleteReview);

module.exports = router;
