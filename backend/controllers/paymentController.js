const Stripe = require('stripe');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { isDecimal } = require('../utils/validation');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const isStripeKeyConfigured =
    typeof stripeSecretKey === 'string' &&
    (stripeSecretKey.startsWith('sk_test_') || stripeSecretKey.startsWith('sk_live_'));

const stripe = isStripeKeyConfigured ? new Stripe(stripeSecretKey) : null;

const buildReceiptUrl = (file) => (file ? `/uploads/payments/${file.filename}` : '');
const paymentMethods = ['cash', 'card', 'online', 'bank-transfer'];
const paymentStatuses = ['pending', 'processing', 'paid', 'failed', 'refunded'];

const syncOrderPayment = async (order, payment) => {
    if (!order) return;

    order.paymentMethod = payment.method === 'bank-transfer' ? 'online' : payment.method;
    order.paymentStatus = payment.status === 'refunded' ? 'failed' : payment.status;
    order.paymentReference = payment.reference || order.paymentReference || '';
    await order.save();
};

const resolvePaymentUserAndOrder = async ({ orderId, userId, currentUser }) => {
    let order = null;
    let paymentUserId = currentUser._id;

    if (orderId) {
        order = await Order.findById(orderId);
        if (!order) {
            return { error: { status: 404, message: 'Order not found' } };
        }

        if (order.userId.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
            return { error: { status: 403, message: 'Not authorized' } };
        }

        paymentUserId = order.userId;
    } else if (userId && currentUser.role === 'admin') {
        const user = await User.findById(userId);
        if (!user) {
            return { error: { status: 404, message: 'User not found' } };
        }
        paymentUserId = user._id;
    }

    return { order, paymentUserId, error: null };
};

const getPaymentByIdWithAccess = async (paymentId, user) => {
    const payment = await Payment.findById(paymentId).populate('order', 'totalAmount status').populate('user', 'name email');
    if (!payment) {
        return { payment: null, error: { status: 404, message: 'Payment not found' } };
    }

    const isOwner = payment.user?._id?.toString() === user._id.toString();
    if (!isOwner && user.role !== 'admin') {
        return { payment: null, error: { status: 403, message: 'Not authorized' } };
    }

    return { payment, error: null };
};

const createPayment = async (req, res) => {
    try {
        const { orderId, userId, amount, method, status, reference } = req.body;

        if (!isDecimal(amount)) {
            return res.status(400).json({ success: false, message: 'Invalid payment amount' });
        }

        if (method && !paymentMethods.includes(method)) {
            return res.status(400).json({ success: false, message: 'Invalid payment method' });
        }

        if (status && !paymentStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid payment status' });
        }

        const { order, paymentUserId, error } = await resolvePaymentUserAndOrder({
            orderId,
            userId,
            currentUser: req.user,
        });

        if (error) {
            return res.status(error.status).json({ success: false, message: error.message });
        }

        const payment = await Payment.create({
            user: paymentUserId,
            order: order ? order._id : null,
            amount,
            method: method || 'cash',
            status: status || 'pending',
            reference: reference || '',
            receiptUrl: buildReceiptUrl(req.file),
        });

        await syncOrderPayment(order, payment);

        const populated = await payment.populate([
            { path: 'order', select: 'totalAmount status' },
            { path: 'user', select: 'name email' },
        ]);

        res.status(201).json({
            success: true,
            message: 'Payment recorded',
            data: populated,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMyPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .populate('order', 'totalAmount status')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: payments.length, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('order', 'totalAmount status')
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: payments.length, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPayment = async (req, res) => {
    try {
        const { payment, error } = await getPaymentByIdWithAccess(req.params.id, req.user);
        if (error) {
            return res.status(error.status).json({ success: false, message: error.message });
        }

        res.json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updatePayment = async (req, res) => {
    try {
        const { payment, error } = await getPaymentByIdWithAccess(req.params.id, req.user);
        if (error) {
            return res.status(error.status).json({ success: false, message: error.message });
        }

        const { orderId, userId, amount, status, method, reference } = req.body;

        if (amount !== undefined) {
            if (!isDecimal(amount)) {
                return res.status(400).json({ success: false, message: 'Invalid payment amount' });
            }
            payment.amount = amount;
        }

        if (method && !paymentMethods.includes(method)) {
            return res.status(400).json({ success: false, message: 'Invalid payment method' });
        }

        if (status && !paymentStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid payment status' });
        }

        if (orderId !== undefined || userId !== undefined) {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            const { order, paymentUserId, error: resolveError } = await resolvePaymentUserAndOrder({
                orderId: orderId || null,
                userId,
                currentUser: req.user,
            });

            if (resolveError) {
                return res.status(resolveError.status).json({ success: false, message: resolveError.message });
            }

            payment.order = order ? order._id : null;
            payment.user = paymentUserId;
        }

        if (status) payment.status = status;
        if (method) payment.method = method;
        if (reference !== undefined) payment.reference = reference;
        if (req.file) payment.receiptUrl = buildReceiptUrl(req.file);

        await payment.save();

        const linkedOrder = payment.order ? await Order.findById(payment.order._id || payment.order) : null;
        await syncOrderPayment(linkedOrder, payment);

        const populated = await payment.populate([
            { path: 'order', select: 'totalAmount status' },
            { path: 'user', select: 'name email' },
        ]);
        res.json({ success: true, message: 'Payment updated', data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deletePayment = async (req, res) => {
    try {
        const { payment, error } = await getPaymentByIdWithAccess(req.params.id, req.user);
        if (error) {
            return res.status(error.status).json({ success: false, message: error.message });
        }

        if (req.user.role !== 'admin' && payment.status === 'paid') {
            return res.status(403).json({ success: false, message: 'Only admins can delete paid payments' });
        }

        await payment.deleteOne();

        res.json({ success: true, message: 'Payment deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPaymentConfig = async (req, res) => {
    return res.json({
        success: true,
        data: {
            cardEnabled: !!stripe,
            availableMethods: ['cash', 'online', ...(stripe ? ['card'] : [])],
        },
    });
};

const createStripeCheckoutSession = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(400).json({
                success: false,
                message: 'Card payment is not configured. Please use Cash on Delivery or Online Transfer.',
            });
        }

        const { orderId, returnUrl } = req.body;

        if (!orderId || !returnUrl) {
            return res.status(400).json({
                success: false,
                message: 'orderId and returnUrl are required',
            });
        }

        const order = await Order.findById(orderId).populate('userId', 'name email');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (order.paymentMethod !== 'card') {
            return res.status(400).json({ success: false, message: 'This order is not marked for card payment' });
        }

        const successUrl = `${returnUrl}?payment=success&orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${returnUrl}?payment=cancel&orderId=${order._id}`;

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'lkr',
                        product_data: {
                            name: `The Hot Chick Order #${order._id.toString().slice(-6).toUpperCase()}`,
                        },
                        unit_amount: Math.round(order.totalAmount),
                    },
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                orderId: order._id.toString(),
                userId: req.user._id.toString(),
            },
        });

        order.paymentStatus = 'processing';
        order.paymentReference = session.id;
        await order.save();

        return res.json({
            success: true,
            message: 'Checkout session created',
            data: {
                sessionId: session.id,
                checkoutUrl: session.url,
            },
        });
    } catch (error) {
        const isStripeConfigError =
            typeof error?.message === 'string' &&
            (error.message.includes('Invalid API Key') || error.message.includes('No API key provided'));

        return res.status(isStripeConfigError ? 400 : 500).json({
            success: false,
            message: isStripeConfigError
                ? 'Card payment is not configured. Please use Cash on Delivery or Online Transfer.'
                : error.message,
        });
    }
};

const verifyStripeCheckoutSession = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(400).json({
                success: false,
                message: 'Card payment is not configured. Please use Cash on Delivery or Online Transfer.',
            });
        }

        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'sessionId is required' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session) {
            return res.status(404).json({ success: false, message: 'Checkout session not found' });
        }

        const orderId = session.metadata?.orderId;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (session.payment_status === 'paid') {
            order.paymentStatus = 'paid';
            order.paymentReference = session.id;
            if (!['delivered', 'cancelled'].includes(order.status)) {
                order.status = 'pending';
            }
            await order.save();
        }

        return res.json({
            success: true,
            message: session.payment_status === 'paid' ? 'Payment confirmed' : 'Payment not completed',
            data: {
                paymentStatus: session.payment_status,
                orderId: order._id,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getPaymentConfig,
    createStripeCheckoutSession,
    verifyStripeCheckoutSession,
    createPayment,
    getMyPayments,
    getAllPayments,
    getPayment,
    updatePayment,
    deletePayment,
};
