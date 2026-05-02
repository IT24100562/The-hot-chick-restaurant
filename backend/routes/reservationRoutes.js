const express = require('express');
const router = express.Router();
const {
    getAvailability,
    createReservation,
    getMyReservations,
    getAllReservations,
    updateReservationStatus,
    cancelReservation,
} = require('../controllers/reservationController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/adminMiddleware');
const { uploadPdf } = require('../middleware/upload');

const reservationUpload = uploadPdf('reservations');

router.get('/availability', protect, getAvailability);
router.get('/my', protect, getMyReservations);
router.get('/', protect, admin, getAllReservations);
router.post('/', protect, reservationUpload.single('confirmationPdf'), createReservation);
router.put('/:id/status', protect, admin, updateReservationStatus);
router.delete('/:id', protect, cancelReservation);

module.exports = router;
