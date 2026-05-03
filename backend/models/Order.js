
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        deliveryPersonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        items: [
            {
                food: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Food',
                    required: true,
                },
                name: String,
                image: String,
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'preparing', 'delivered', 'cancelled'],
            default: 'pending',
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'online'],
            default: 'cash',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'processing', 'paid', 'failed'],
            default: 'pending',
        },
        paymentReference: {
            type: String,
            default: '',
        },
        deliveryAddress: {
            type: String,
            default: '',
        },
        deliveryLocation: {
            latitude: {
                type: Number,
                default: null,
            },
            longitude: {
                type: Number,
                default: null,
            },
            mapUrl: {
                type: String,
                default: '',
            },
        },
        specialInstructions: {
            type: String,
            default: '',
        },
        estimatedDeliveryTime: {
            type: Number,
            default: 30,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
