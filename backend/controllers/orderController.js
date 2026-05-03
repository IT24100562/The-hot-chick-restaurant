
const Order = require('../models/Order');
const { isDecimal, isNumeric } = require('../utils/validation');

const ORDER_UPDATE_WINDOW_MS = 5 * 60 * 1000;
const ORDER_STATUS_FLOW = ['pending', 'preparing', 'delivered'];
const ORDER_STATUS_ALLOWED = [...ORDER_STATUS_FLOW, 'cancelled'];
const LEGACY_STATUS_MAP = {
    confirmed: 'pending',
    ready: 'preparing',
    assigned: 'preparing',
    picked: 'preparing',
    'on-the-way': 'preparing',
};

const normalizeStatus = (status) => LEGACY_STATUS_MAP[status] || status;

const isValidStatusTransition = (currentStatus, nextStatus) => {
    const normalizedStatus = normalizeStatus(currentStatus);

    if (normalizedStatus === nextStatus) {
        return true;
    }

    const transitions = {
        pending: ['preparing', 'cancelled'],
        preparing: ['delivered', 'cancelled'],
        delivered: [],
        cancelled: [],
    };

    return (transitions[normalizedStatus] || []).includes(nextStatus);
};

const getOrderWindowState = (order) => {
    const createdAtMs = new Date(order.createdAt).getTime();
    const expiresAtMs = createdAtMs + ORDER_UPDATE_WINDOW_MS;
    const remainingMs = Math.max(0, expiresAtMs - Date.now());
    return {
        canEditByTime: remainingMs > 0,
        remainingSeconds: Math.ceil(remainingMs / 1000),
    };
};

const validateOrderUpdateAccess = (order, userId) => {
    if (order.userId.toString() !== userId.toString()) {
        return { allowed: false, statusCode: 403, message: 'Not authorized to modify this order' };
    }

    if (order.status !== 'pending') {
        return {
            allowed: false,
            statusCode: 400,
            message: 'Order can be modified only while pending',
        };
    }

    const { canEditByTime, remainingSeconds } = getOrderWindowState(order);
    if (!canEditByTime) {
        return {
            allowed: false,
            statusCode: 400,
            message: 'Order can only be modified or deleted within 5 minutes of placing it',
            remainingSeconds,
        };
    }

    return { allowed: true, statusCode: 200, remainingSeconds };
};

// @desc    Create an order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const {
            items,
            totalAmount,
            paymentMethod,
            paymentStatus,
            paymentReference,
            deliveryAddress,
            deliveryLocation,
            specialInstructions,
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No order items' });
        }

        if (!isDecimal(totalAmount)) {
            return res.status(400).json({ success: false, message: 'Invalid total amount' });
        }

        for (const item of items) {
            if (!isNumeric(item.quantity) || Number(item.quantity) <= 0) {
                return res.status(400).json({ success: false, message: 'Item quantity must be a positive number' });
            }
            if (!isDecimal(item.price)) {
                return res.status(400).json({ success: false, message: 'Item price must be a valid number' });
            }
        }

        const resolvedPaymentMethod = paymentMethod || 'cash';
        const hasSimulatedCardPayment =
            resolvedPaymentMethod === 'card' && typeof paymentStatus === 'string' && paymentStatus === 'paid';

        const order = await Order.create({
            userId: req.user._id,
            items,
            totalAmount,
            paymentMethod: resolvedPaymentMethod,
            paymentStatus: hasSimulatedCardPayment
                ? 'paid'
                : resolvedPaymentMethod === 'card'
                    ? 'processing'
                    : 'pending',
            paymentReference: hasSimulatedCardPayment
                ? paymentReference || `SIM-${Date.now()}`
                : '',
            deliveryAddress: deliveryAddress || req.user.address,
            deliveryLocation: {
                latitude: Number.isFinite(Number(deliveryLocation?.latitude)) ? Number(deliveryLocation.latitude) : null,
                longitude: Number.isFinite(Number(deliveryLocation?.longitude)) ? Number(deliveryLocation.longitude) : null,
                mapUrl: deliveryLocation?.mapUrl || '',
            },
            specialInstructions: specialInstructions || '',
        });

        const populatedOrder = await order.populate('userId', 'name email phone');

        // Emit real-time event to admin
        const io = req.app.get('io');
        io.to('admin').emit('newOrder', {
            message: `New order from ${req.user.name}`,
            order: populatedOrder,
        });

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: populatedOrder,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id })
            .populate('items.food', 'name image price')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders/all
// @access  Admin
const getAllOrders = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        const orders = await Order.find(query)
            .populate('userId', 'name email phone')
            .populate('items.food', 'name image price')
            .sort({ createdAt: -1 });

        // Calculate stats
        const totalRevenue = orders
            .filter((o) => o.status === 'delivered')
            .reduce((sum, o) => sum + o.totalAmount, 0);

        res.json({
            success: true,
            count: orders.length,
            totalRevenue,
            data: orders,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('items.food', 'name image price');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Only allow owner or admin to view
        if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Admin
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!ORDER_STATUS_ALLOWED.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const order = await Order.findById(req.params.id).populate('userId', 'name email phone');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const normalizedStatus = normalizeStatus(order.status);
        if (normalizedStatus !== order.status) {
            order.status = normalizedStatus;
        }

        if (!isValidStatusTransition(order.status, status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from ${order.status} to ${status}`,
            });
        }

        order.status = status;
        await order.save();

        // Emit real-time update to customer
        const io = req.app.get('io');
        io.to(order.userId._id.toString()).emit('orderStatusUpdate', {
            orderId: order._id,
            status: order.status,
            message: `Your order is now ${status}`,
        });

        io.to('admin').emit('adminOrderUpdated', {
            order,
        });

        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            data: order,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update own order within 5 minutes
// @route   PUT /api/orders/:id
// @access  Private
const updateMyOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const access = validateOrderUpdateAccess(order, req.user._id);
        if (!access.allowed) {
            return res.status(access.statusCode).json({
                success: false,
                message: access.message,
                remainingSeconds: access.remainingSeconds,
            });
        }

        const { deliveryAddress, deliveryLocation, specialInstructions, paymentMethod } = req.body;
        const validPaymentMethods = ['cash', 'card', 'online'];

        if (typeof deliveryAddress === 'string') {
            order.deliveryAddress = deliveryAddress;
        }

        if (typeof specialInstructions === 'string') {
            order.specialInstructions = specialInstructions;
        }

        if (deliveryLocation && typeof deliveryLocation === 'object') {
            order.deliveryLocation = {
                latitude: Number.isFinite(Number(deliveryLocation.latitude)) ? Number(deliveryLocation.latitude) : null,
                longitude: Number.isFinite(Number(deliveryLocation.longitude)) ? Number(deliveryLocation.longitude) : null,
                mapUrl: deliveryLocation.mapUrl || '',
            };
        }

        if (typeof paymentMethod === 'string') {
            if (!validPaymentMethods.includes(paymentMethod)) {
                return res.status(400).json({ success: false, message: 'Invalid payment method' });
            }

            order.paymentMethod = paymentMethod;
            if (order.paymentStatus !== 'paid') {
                order.paymentStatus = paymentMethod === 'card' ? 'processing' : 'pending';
            }
        }

        await order.save();

        const populatedOrder = await order.populate('items.food', 'name image price');

        res.json({
            success: true,
            message: 'Order updated successfully',
            data: populatedOrder,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete own order within 5 minutes
// @route   DELETE /api/orders/:id
// @access  Private
const deleteMyOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const access = validateOrderUpdateAccess(order, req.user._id);
        if (!access.allowed) {
            return res.status(access.statusCode).json({
                success: false,
                message: access.message,
                remainingSeconds: access.remainingSeconds,
            });
        }

        await order.deleteOne();

        res.json({
            success: true,
            message: 'Order deleted successfully',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getAllOrders,
    getOrder,
    updateOrderStatus,
    updateMyOrder,
    deleteMyOrder,
    assignDeliveryPerson,
    getDeliveryOrders,
    updateDeliveryStatus,
};

// @desc    Assign delivery person to order (Admin)
// @route   PUT /api/orders/:id/assign-delivery
// @access  Private (Admin)
async function assignDeliveryPerson(req, res) {
    try {
        const { deliveryPersonId } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.deliveryPersonId = deliveryPersonId;
        if (order.status === 'pending') {
            order.status = 'preparing';
        }
        await order.save();

        const populatedOrder = await order.populate([
            { path: 'userId', select: 'name email phone' },
            { path: 'deliveryPersonId', select: 'name email phone' },
        ]);

        res.json({
            success: true,
            message: 'Delivery person assigned',
            data: populatedOrder,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// @desc    Get orders assigned to delivery person
// @route   GET /api/orders/delivery/my-orders
// @access  Private (Delivery)
async function getDeliveryOrders(req, res) {
    try {
        const orders = await Order.find({ deliveryPersonId: req.user._id })
            .populate('userId', 'name email phone address')
            .populate('items.food', 'name image price')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// @desc    Update delivery order status
// @route   PUT /api/orders/:id/delivery-status
// @access  Private (Delivery)
async function updateDeliveryStatus(req, res) {
    try {
        const { status } = req.body;
        const validStatuses = ['delivered'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.deliveryPersonId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const normalizedStatus = normalizeStatus(order.status);
        if (normalizedStatus !== order.status) {
            order.status = normalizedStatus;
        }

        if (!isValidStatusTransition(order.status, status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from ${order.status} to ${status}`,
            });
        }

        order.status = status;
        await order.save();

        const populatedOrder = await order.populate([
            { path: 'userId', select: 'name email phone' },
            { path: 'deliveryPersonId', select: 'name email phone' },
        ]);

        // Emit real-time update
        const io = req.app.get('io');
        io.to(`order-${order._id}`).emit('statusUpdate', {
            orderId: order._id,
            status: order.status,
            message: `Order status updated to ${status}`,
        });

        io.to('admin').emit('adminOrderUpdated', {
            order: populatedOrder,
        });

        res.json({
            success: true,
            message: 'Status updated',
            data: populatedOrder,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
