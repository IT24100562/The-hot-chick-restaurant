const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/adminMiddleware');

router.post('/', protect, createOrder);
router.get('/', protect, getMyOrders);
router.get('/all', protect, admin, getAllOrders);
router.get('/:id', protect, getOrder);
router.put('/:id', protect, updateMyOrder);
router.delete('/:id', protect, deleteMyOrder);
router.put('/:id/status', protect, admin, updateOrderStatus);

// Delivery routes
router.put('/:id/assign-delivery', protect, admin, assignDeliveryPerson);
router.get('/delivery/my-orders', protect, getDeliveryOrders);
router.put('/:id/delivery-status', protect, updateDeliveryStatus);

module.exports = router;
