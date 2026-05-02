const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        guestName: {
            type: String,
            required: [true, 'Guest name is required'],
            trim: true,
            maxlength: [80, 'Guest name is too long'],
        },
        guestPhone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
            maxlength: [25, 'Phone number is too long'],
        },
        guestEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: '',
        },
        date: {
            type: Date,
            required: [true, 'Reservation date is required'],
        },
        dateKey: {
            type: String,
            required: true,
            match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format'],
            index: true,
        },
        timeSlot: {
            type: String,
            required: [true, 'Reservation time is required'],
            trim: true,
        },
        partySize: {
            type: Number,
            required: [true, 'Number of guests is required'],
            min: [1, 'At least 1 guest is required'],
            max: [20, 'Reservations are limited to 20 guests'],
        },
        tableNumber: {
            type: Number,
            required: true,
            min: 1,
        },
        occasion: {
            type: String,
            enum: ['', 'birthday', 'anniversary', 'business', 'date', 'family', 'other'],
            default: '',
        },
        specialRequests: {
            type: String,
            trim: true,
            maxlength: [500, 'Special requests must be 500 characters or less'],
            default: '',
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'],
            default: 'confirmed',
            index: true,
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

reservationSchema.index({ dateKey: 1, timeSlot: 1, tableNumber: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
