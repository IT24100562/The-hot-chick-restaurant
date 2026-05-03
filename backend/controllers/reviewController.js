const Review = require('../models/Review');
const Food = require('../models/Food');
const Order = require('../models/Order');

const MIN_COMMENT_LENGTH = 10;
const MAX_COMMENT_LENGTH = 300;

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
    try {
        const { orderId, food, rating, comment } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order is required to submit a review' });
        }

        if (!rating || Number(rating) < 1 || Number(rating) > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        if (!comment || !comment.trim()) {
            return res.status(400).json({ success: false, message: 'Review comment is required' });
        }

        const trimmedComment = comment.trim();
        if (trimmedComment.length < MIN_COMMENT_LENGTH) {
            return res.status(400).json({ success: false, message: `Review must be at least ${MIN_COMMENT_LENGTH} characters` });
        }

        if (trimmedComment.length > MAX_COMMENT_LENGTH) {
            return res.status(400).json({ success: false, message: `Review must be less than ${MAX_COMMENT_LENGTH} characters` });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to review this order' });
        }

        if (order.status !== 'delivered') {
            return res.status(400).json({ success: false, message: 'Reviews are allowed only after delivery' });
        }

        const existing = await Review.findOne({ user: req.user._id, order: orderId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You already reviewed this order' });
        }

        const foodPhotoUrl = req.files?.foodPhoto?.[0]
            ? `/uploads/reviews/${req.files.foodPhoto[0].filename}`
            : '';
        const feedbackImageUrls = Array.isArray(req.files?.feedbackImages)
            ? req.files.feedbackImages.map((file) => `/uploads/reviews/${file.filename}`)
            : [];

        const reviewData = {
            user: req.user._id,
            order: orderId,
            rating,
            comment: trimmedComment,
            foodPhotoUrl,
            feedbackImageUrls,
        };

        if (food) {
            reviewData.food = food;
        }

        const review = await Review.create(reviewData);

        if (food) {
            const reviews = await Review.find({ food });
            const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
            await Food.findByIdAndUpdate(food, { rating: avgRating.toFixed(1), numReviews: reviews.length });
        }

        const populatedReview = await review.populate('user', 'name avatar');

        // Notify admin of new review
        const io = req.app.get('io');
        io.to('admin').emit('newReview', {
            message: `New review from ${req.user.name}`,
            review: populatedReview,
        });

        res.status(201).json({ success: true, message: 'Review submitted', data: populatedReview });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get reviews for a food item
// @route   GET /api/reviews/food/:id
// @access  Public
const getFoodReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ food: req.params.id })
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get review for an order (current user)
// @route   GET /api/reviews/order/:id
// @access  Private
const getOrderReview = async (req, res) => {
    try {
        const review = await Review.findOne({ order: req.params.id, user: req.user._id })
            .populate('user', 'name avatar');

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get reviews for current user's orders
// @route   GET /api/reviews/my-orders
// @access  Private
const getMyOrderReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user._id, order: { $ne: null } })
            .select('order rating comment createdAt')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all reviews (admin)
// @route   GET /api/reviews
// @access  Admin
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name avatar email')
            .populate('food', 'name image')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin reply to review
// @route   PUT /api/reviews/:id/reply
// @access  Admin
const replyToReview = async (req, res) => {
    try {
        const { adminReply } = req.body;

        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { adminReply, adminRepliedAt: Date.now() },
            { new: true }
        )
            .populate('user', 'name avatar')
            .populate('food', 'name image');

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Notify customer of admin reply
        const io = req.app.get('io');
        io.to(review.user._id.toString()).emit('reviewReply', {
            message: 'Admin replied to your review',
            review,
        });

        res.json({ success: true, message: 'Reply added', data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Admin
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Recalculate food rating
        const reviews = await Review.find({ food: review.food });
        const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
        await Food.findByIdAndUpdate(review.food, { rating: avgRating.toFixed(1), numReviews: reviews.length });

        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createReview,
    getFoodReviews,
    getOrderReview,
    getMyOrderReviews,
    getAllReviews,
    replyToReview,
    deleteReview,
};
