const express = require('express');
const router = express.Router();
const {
    createDeliveryBooking,
    getMyDeliveryBookings,
    getAllDeliveryBookings,
    getDeliveryBooking,
    updateDeliveryBookingStatus,
    deleteDeliveryBooking,
} = require('../controllers/deliveryBookingController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/adminMiddleware');
const { uploadPdf } = require('../middleware/upload');

const bookingUpload = uploadPdf('reservations');

router.post('/', protect, bookingUpload.single('confirmationPdf'), createDeliveryBooking);
router.get('/', protect, getMyDeliveryBookings);
router.get('/all', protect, admin, getAllDeliveryBookings);
router.get('/:id', protect, getDeliveryBooking);
router.put('/:id/status', protect, admin, updateDeliveryBookingStatus);
router.delete('/:id', protect, deleteDeliveryBooking);

module.exports = router;
