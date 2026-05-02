const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
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
        amount: {
            type: Number,
            required: [true, 'Payment amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        method: {
            type: String,
            enum: ['cash', 'card', 'online', 'bank-transfer'],
            default: 'cash',
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        receiptUrl: {
            type: String,
            default: '',
        },
        reference: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
