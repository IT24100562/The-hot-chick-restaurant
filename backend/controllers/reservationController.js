const Reservation = require('../models/Reservation');

const RESTAURANT_TABLES = [
    { number: 1, capacity: 2 },
    { number: 2, capacity: 2 },
    { number: 3, capacity: 4 },
    { number: 4, capacity: 4 },
    { number: 5, capacity: 6 },
    { number: 6, capacity: 6 },
    { number: 7, capacity: 8 },
    { number: 8, capacity: 10 },
    { number: 9, capacity: 12 },
    { number: 10, capacity: 20 },
];

const WORKING_TIME_SLOTS = [
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
    '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM',
];

const ACTIVE_STATUSES = ['pending', 'confirmed', 'seated'];

const parseDateKey = (date) => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return null;
    }

    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toISOString().slice(0, 10) === date ? date : null;
};

const pad2 = (value) => String(value).padStart(2, '0');

const getTodayKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};

const timeSlotToMinutes = (timeSlot) => {
    const match = /^(\d{1,2}):(\d{2})\s(AM|PM)$/.exec(timeSlot);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3];

    if (hours === 12) hours = 0;
    if (period === 'PM') hours += 12;

    return hours * 60 + minutes;
};

const isPastSameDayTime = (dateKey, timeSlot) => {
    if (dateKey !== getTodayKey()) return false;

    const slotMinutes = timeSlotToMinutes(timeSlot);
    if (slotMinutes === null) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes <= currentMinutes;
};

const normalizePartySize = (value) => {
    if (typeof value === 'string' && !/^\d+$/.test(value.trim())) {
        return NaN;
    }

    return Number(value);
};

const getReservedTableNumbers = async (dateKey, timeSlot) => {
    const reservations = await Reservation.find({
        dateKey,
        timeSlot,
        status: { $in: ACTIVE_STATUSES },
    }).select('tableNumber');

    return reservations.map((reservation) => reservation.tableNumber);
};

const buildAvailability = async (dateKey, timeSlot, partySize = 1) => {
    const reservedTableNumbers = await getReservedTableNumbers(dateKey, timeSlot);
    const party = normalizePartySize(partySize);

    return RESTAURANT_TABLES.map((table) => ({
        ...table,
        available: !reservedTableNumbers.includes(table.number) && table.capacity >= party,
    }));
};

const validateReservationPayload = (body) => {
    const errors = {};
    const guestName = typeof body.guestName === 'string' ? body.guestName.trim() : '';
    const guestPhone = typeof body.guestPhone === 'string' ? body.guestPhone.trim() : '';
    const guestEmail = typeof body.guestEmail === 'string' ? body.guestEmail.trim().toLowerCase() : '';
    const dateKey = parseDateKey(body.date);
    const timeSlot = typeof body.timeSlot === 'string' ? body.timeSlot.trim() : '';
    const partySize = normalizePartySize(body.partySize);
    const tableNumber = body.tableNumber === null || body.tableNumber === undefined || body.tableNumber === ''
        ? null
        : normalizePartySize(body.tableNumber);
    const occasion = typeof body.occasion === 'string' ? body.occasion.trim() : '';
    const specialRequests = typeof body.specialRequests === 'string' ? body.specialRequests.trim() : '';

    if (!guestName) errors.guestName = 'Name is required';
    if (!guestPhone) errors.guestPhone = 'Phone number is required';
    if (guestPhone && !/^[0-9+\-\s()]{7,25}$/.test(guestPhone)) {
        errors.guestPhone = 'Enter a valid phone number';
    }
    if (guestEmail && !/^\S+@\S+\.\S+$/.test(guestEmail)) {
        errors.guestEmail = 'Enter a valid email address';
    }
    if (!dateKey) errors.date = 'Select a valid reservation date';
    if (dateKey && dateKey < getTodayKey()) errors.date = 'Reservation date cannot be in the past';
    if (!timeSlot) errors.timeSlot = 'Select a reservation time';
    if (timeSlot && !WORKING_TIME_SLOTS.includes(timeSlot)) {
        errors.timeSlot = 'Select a time within restaurant working hours';
    }
    if (dateKey && timeSlot && WORKING_TIME_SLOTS.includes(timeSlot) && isPastSameDayTime(dateKey, timeSlot)) {
        errors.timeSlot = 'Select a future time for today';
    }
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
        errors.partySize = 'Guests must be a whole number from 1 to 20';
    }
    if (tableNumber !== null && (!Number.isInteger(tableNumber) || !RESTAURANT_TABLES.some((table) => table.number === tableNumber))) {
        errors.tableNumber = 'Select a valid table';
    }
    if (specialRequests.length > 500) {
        errors.specialRequests = 'Special requests must be 500 characters or less';
    }

    return {
        errors,
        value: {
            guestName,
            guestPhone,
            guestEmail,
            dateKey,
            timeSlot,
            partySize,
            tableNumber,
            occasion,
            specialRequests,
        },
    };
};

const getAvailability = async (req, res) => {
    try {
        const dateKey = parseDateKey(req.query.date);
        const timeSlot = typeof req.query.timeSlot === 'string' ? req.query.timeSlot.trim() : '';
        const partySize = normalizePartySize(req.query.partySize || 1);

        if (!dateKey) {
            return res.status(400).json({ success: false, message: 'A valid date is required' });
        }
        if (!WORKING_TIME_SLOTS.includes(timeSlot)) {
            return res.status(400).json({ success: false, message: 'A valid time slot is required' });
        }
        if (dateKey < getTodayKey()) {
            return res.status(400).json({ success: false, message: 'Reservation date cannot be in the past' });
        }
        if (isPastSameDayTime(dateKey, timeSlot)) {
            return res.status(400).json({ success: false, message: 'Select a future time for today' });
        }
        if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
            return res.status(400).json({ success: false, message: 'Guests must be a whole number from 1 to 20' });
        }

        const tables = await buildAvailability(dateKey, timeSlot, partySize);
        res.json({ success: true, data: { tables, timeSlots: WORKING_TIME_SLOTS } });
    } catch (error) {
        console.error('Reservation availability error:', error);
        res.status(500).json({ success: false, message: 'Could not check table availability' });
    }
};

const createReservation = async (req, res) => {
    try {
        const { errors, value } = validateReservationPayload(req.body);
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: Object.values(errors)[0],
                errors,
            });
        }

        const tables = await buildAvailability(value.dateKey, value.timeSlot, value.partySize);
        const selectedTable = value.tableNumber
            ? tables.find((table) => table.number === value.tableNumber)
            : tables.find((table) => table.available);

        if (!selectedTable) {
            return res.status(409).json({
                success: false,
                message: 'No table is available for that date, time, and party size',
            });
        }

        if (!selectedTable.available) {
            return res.status(409).json({
                success: false,
                message: `Table ${selectedTable.number} is already reserved for that time`,
            });
        }

        const reservation = await Reservation.create({
            user: req.user._id,
            guestName: value.guestName,
            guestPhone: value.guestPhone,
            guestEmail: value.guestEmail,
            date: new Date(`${value.dateKey}T00:00:00.000Z`),
            dateKey: value.dateKey,
            timeSlot: value.timeSlot,
            partySize: value.partySize,
            tableNumber: selectedTable.number,
            occasion: value.occasion,
            specialRequests: value.specialRequests,
            status: 'confirmed',
        });

        const populatedReservation = await reservation.populate('user', 'name email phone');
        const io = req.app.get('io');
        if (io) {
            io.to('admin').emit('newReservation', { reservation: populatedReservation });
        }

        res.status(201).json({
            success: true,
            message: 'Reservation confirmed',
            data: populatedReservation,
        });
    } catch (error) {
        console.error('Create reservation error:', error);
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'That table is already reserved for the selected date and time',
            });
        }
        res.status(500).json({ success: false, message: 'Could not create reservation' });
    }
};

const getMyReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ user: req.user._id })
            .sort({ date: 1, timeSlot: 1, createdAt: -1 });

        res.json({ success: true, count: reservations.length, data: reservations });
    } catch (error) {
        console.error('Get my reservations error:', error);
        res.status(500).json({ success: false, message: 'Could not load reservations' });
    }
};

const getAllReservations = async (req, res) => {
    try {
        const { status, date, search } = req.query;
        const query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (date) {
            const dateKey = parseDateKey(date);
            if (!dateKey) {
                return res.status(400).json({ success: false, message: 'A valid date is required' });
            }
            query.dateKey = dateKey;
        }

        if (search && String(search).trim()) {
            const term = String(search).trim();
            query.$or = [
                { guestName: { $regex: term, $options: 'i' } },
                { guestPhone: { $regex: term, $options: 'i' } },
                { guestEmail: { $regex: term, $options: 'i' } },
            ];
        }

        const reservations = await Reservation.find(query)
            .populate('user', 'name email phone')
            .sort({ date: 1, timeSlot: 1, createdAt: -1 });

        res.json({ success: true, count: reservations.length, data: reservations });
    } catch (error) {
        console.error('Get reservations error:', error);
        res.status(500).json({ success: false, message: 'Could not load reservations' });
    }
};

const updateReservationStatus = async (req, res) => {
    try {
        const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'seated', 'completed', 'no-show'];
        const { status } = req.body;

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Select a valid reservation status' });
        }

        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (ACTIVE_STATUSES.includes(status)) {
            const conflict = await Reservation.findOne({
                _id: { $ne: reservation._id },
                dateKey: reservation.dateKey,
                timeSlot: reservation.timeSlot,
                tableNumber: reservation.tableNumber,
                status: { $in: ACTIVE_STATUSES },
            });

            if (conflict) {
                return res.status(409).json({
                    success: false,
                    message: `Table ${reservation.tableNumber} is already reserved for that time`,
                });
            }
        }

        reservation.status = status;
        await reservation.save();
        const populatedReservation = await reservation.populate('user', 'name email phone');

        const io = req.app.get('io');
        if (io) {
            io.to('admin').emit('reservationUpdated', { reservation: populatedReservation });
            io.to(String(reservation.user)).emit('reservationUpdated', { reservation: populatedReservation });
        }

        res.json({
            success: true,
            message: 'Reservation status updated',
            data: populatedReservation,
        });
    } catch (error) {
        console.error('Update reservation status error:', error);
        res.status(500).json({ success: false, message: 'Could not update reservation status' });
    }
};

const cancelReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (reservation.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this reservation' });
        }

        if (!ACTIVE_STATUSES.includes(reservation.status)) {
            return res.status(400).json({ success: false, message: 'This reservation cannot be cancelled' });
        }

        reservation.status = 'cancelled';
        await reservation.save();

        const io = req.app.get('io');
        if (io) {
            io.to('admin').emit('reservationUpdated', { reservation });
            io.to(String(reservation.user)).emit('reservationUpdated', { reservation });
        }

        res.json({ success: true, message: 'Reservation cancelled', data: reservation });
    } catch (error) {
        console.error('Cancel reservation error:', error);
        res.status(500).json({ success: false, message: 'Could not cancel reservation' });
    }
};

module.exports = {
    RESTAURANT_TABLES,
    WORKING_TIME_SLOTS,
    getAvailability,
    createReservation,
    getMyReservations,
    getAllReservations,
    updateReservationStatus,
    cancelReservation,
};
