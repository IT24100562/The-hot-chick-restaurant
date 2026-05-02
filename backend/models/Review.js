const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
        },
        food: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Food',
            default: null,
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: [true, 'Review comment is required'],
            trim: true,
        },
        adminReply: {
            type: String,
            default: '',
        },
        adminRepliedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// One review per user per food (when food provided)
reviewSchema.index({ user: 1, food: 1 }, { unique: true, sparse: true });
// One review per user per order
reviewSchema.index({ user: 1, order: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', reviewSchema);
