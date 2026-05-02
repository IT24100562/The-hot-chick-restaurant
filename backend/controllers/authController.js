const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { isAlphaSpace, isEmail, isNumeric, trimSpaces } = require('../utils/validation');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password, phone, address, role } = req.body;

        const trimmedName = trimSpaces(name);
        const trimmedEmail = trimSpaces(email).toLowerCase();

        if (!trimmedName || !trimmedEmail || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }

        if (!isAlphaSpace(trimmedName)) {
            return res.status(400).json({ success: false, message: 'Name can include only letters and spaces' });
        }

        if (!isEmail(trimmedEmail)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        if (String(password).length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        if (phone && !isNumeric(phone)) {
            return res.status(400).json({ success: false, message: 'Phone must contain only numbers' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email: trimmedEmail });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        // Validate role
        const validRoles = ['customer', 'delivery'];
        const userRole = role && validRoles.includes(role) ? role : 'customer';

        const avatarUrl = req.file ? `/uploads/users/${req.file.filename}` : '';

        // Create user
        const user = await User.create({
            name: trimmedName,
            email: trimmedEmail,
            password,
            phone: phone || '',
            address: address || '',
            role: userRole,
            status: 'active',
            avatar: avatarUrl,
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
                avatar: user.avatar,
                token: generateToken(user._id),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const trimmedEmail = trimSpaces(email).toLowerCase();

        if (!trimmedEmail || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        if (!isEmail(trimmedEmail)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        // Find user
        const user = await User.findOne({ email: trimmedEmail });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Check if user is blocked or inactive
        if (user.status === 'blocked') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked. Please contact admin.',
            });
        }

        if (user.status === 'inactive') {
            return res.status(403).json({
                success: false,
                message: 'Your account is inactive. Please contact admin.',
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                status: user.status,
                avatar: user.avatar,
                token: generateToken(user._id),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            if (req.body.name !== undefined) {
                const trimmedName = trimSpaces(req.body.name);
                if (!trimmedName) {
                    return res.status(400).json({ success: false, message: 'Name is required' });
                }
                if (!isAlphaSpace(trimmedName)) {
                    return res.status(400).json({ success: false, message: 'Name can include only letters and spaces' });
                }
                user.name = trimmedName;
            }

            if (req.body.phone !== undefined) {
                if (req.body.phone && !isNumeric(req.body.phone)) {
                    return res.status(400).json({ success: false, message: 'Phone must contain only numbers' });
                }
                user.phone = req.body.phone || '';
            }

            if (req.body.address !== undefined) {
                const trimmedAddress = trimSpaces(req.body.address);
                if (!trimmedAddress) {
                    return res.status(400).json({ success: false, message: 'Address is required' });
                }
                user.address = trimmedAddress;
            }
            if (req.file) {
                user.avatar = `/uploads/users/${req.file.filename}`;
            } else if (req.body.avatar !== undefined) {
                user.avatar = req.body.avatar || '';
            }

            if (req.body.password) {
                if (String(req.body.password).length < 6) {
                    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
                }
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    _id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    address: updatedUser.address,
                    role: updatedUser.role,
                    avatar: updatedUser.avatar,
                    token: generateToken(updatedUser._id),
                },
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = { register, login, getProfile, updateProfile };
