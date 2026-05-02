const mongoose = require('mongoose');

const deliveryBookingSchema = new mongoose.Schema(
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
        contactName: {
            type: String,
            required: [true, 'Contact name is required'],
            trim: true,
        },
        contactPhone: {
            type: String,
            required: [true, 'Contact phone is required'],
            trim: true,
        },
        deliveryAddress: {
            type: String,
            required: [true, 'Delivery address is required'],
            trim: true,
        },
        deliveryDate: {
            type: Date,
            required: [true, 'Delivery date is required'],
        },
        timeSlot: {
            type: String,
            required: [true, 'Delivery time is required'],
            trim: true,
        },
        notes: {
            type: String,
            default: '',
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'out-for-delivery', 'delivered', 'cancelled'],
            default: 'confirmed',
        },
        confirmationPdfUrl: {
            type: String,
            default: '',
        },
        qrCodeUrl: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('DeliveryBooking', deliveryBookingSchema);
