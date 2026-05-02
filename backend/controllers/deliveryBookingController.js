const DeliveryBooking = require('../models/DeliveryBooking');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const RESERVATION_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'reservations');

const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const generateBookingQr = async (bookingId) => {
    ensureDir(RESERVATION_UPLOAD_DIR);
    const filename = `delivery-qr-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
    const filePath = path.join(RESERVATION_UPLOAD_DIR, filename);
    await QRCode.toFile(filePath, `delivery-booking:${bookingId}`, { width: 320, margin: 1 });
    return `/uploads/reservations/${filename}`;
};

const createDeliveryBooking = async (req, res) => {
    try {
        const { contactName, contactPhone, deliveryAddress, deliveryDate, timeSlot, notes, orderId } = req.body;

        if (!contactName || !contactName.trim()) {
            return res.status(400).json({ success: false, message: 'Contact name is required' });
        }
        if (!contactPhone || !contactPhone.trim()) {
            return res.status(400).json({ success: false, message: 'Contact phone is required' });
        }
        if (!deliveryAddress || !deliveryAddress.trim()) {
            return res.status(400).json({ success: false, message: 'Delivery address is required' });
        }
        if (!deliveryDate) {
            return res.status(400).json({ success: false, message: 'Delivery date is required' });
        }
        if (!timeSlot || !timeSlot.trim()) {
            return res.status(400).json({ success: false, message: 'Delivery time is required' });
        }

        const confirmationPdfUrl = req.file ? `/uploads/reservations/${req.file.filename}` : '';

        const booking = await DeliveryBooking.create({
            user: req.user._id,
            order: orderId || null,
            contactName: contactName.trim(),
            contactPhone: contactPhone.trim(),
            deliveryAddress: deliveryAddress.trim(),
            deliveryDate: new Date(deliveryDate),
            timeSlot: timeSlot.trim(),
            notes: notes ? notes.trim() : '',
            status: 'confirmed',
            confirmationPdfUrl,
        });

        booking.qrCodeUrl = await generateBookingQr(booking._id.toString());
        await booking.save();

        const populated = await booking.populate('user', 'name email phone');

        res.status(201).json({
            success: true,
            message: 'Delivery booking created',
            data: populated,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMyDeliveryBookings = async (req, res) => {
    try {
        const bookings = await DeliveryBooking.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllDeliveryBookings = async (req, res) => {
    try {
        const bookings = await DeliveryBooking.find()
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getDeliveryBooking = async (req, res) => {
    try {
        const booking = await DeliveryBooking.findById(req.params.id)
            .populate('user', 'name email phone');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Delivery booking not found' });
        }

        if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateDeliveryBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const booking = await DeliveryBooking.findById(req.params.id)
            .populate('user', 'name email phone');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Delivery booking not found' });
        }

        if (status) {
            booking.status = status;
        }

        await booking.save();

        res.json({ success: true, message: 'Delivery booking updated', data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteDeliveryBooking = async (req, res) => {
    try {
        const booking = await DeliveryBooking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Delivery booking not found' });
        }

        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await booking.deleteOne();

        res.json({ success: true, message: 'Delivery booking deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createDeliveryBooking,
    getMyDeliveryBookings,
    getAllDeliveryBookings,
    getDeliveryBooking,
    updateDeliveryBookingStatus,
    deleteDeliveryBooking,
};
