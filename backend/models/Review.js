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
        foodPhotoUrl: {
            type: String,
            default: '',
        },
        feedbackImageUrls: {
            type: [String],
            default: [],
        },
        adminRepliedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// One review per user per food (only when a food is actually present)
reviewSchema.index(
    { user: 1, food: 1 },
    {
        unique: true,
        partialFilterExpression: { food: { $type: 'objectId' } },
    }
);
// One review per user per order
reviewSchema.index(
    { user: 1, order: 1 },
    {
        unique: true,
        partialFilterExpression: { order: { $type: 'objectId' } },
    }
);

module.exports = mongoose.model('Review', reviewSchema);
