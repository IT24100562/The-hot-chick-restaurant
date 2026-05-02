const User = require('../models/User');
const Order = require('../models/Order');

// Get all users with filters
exports.getAllUsers = async (req, res) => {
    try {
        const { role, status, search } = req.query;
        
        let filter = {};
        if (role && role !== 'all') filter.role = role;
        if (status && status !== 'all') filter.status = status;
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(filter)
            .select('id name email phone address role status createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('id name email phone address role status createdAt');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update user role
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!['customer', 'delivery', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['active', 'inactive', 'blocked'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get delivery persons only
exports.getDeliveryPersons = async (req, res) => {
    try {
        const deliveryPersons = await User.find({ role: 'delivery' })
            .select('id name email phone status createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: deliveryPersons.length,
            data: deliveryPersons,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user dashboard stats
exports.getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const customers = await User.countDocuments({ role: 'customer' });
        const deliveryPersons = await User.countDocuments({ role: 'delivery' });
        const activeUsers = await User.countDocuments({ status: 'active' });
        const blockedUsers = await User.countDocuments({ status: 'blocked' });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                customers,
                deliveryPersons,
                activeUsers,
                blockedUsers,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
