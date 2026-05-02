const express = require('express');
const {
    getAllUsers,
    getUserById,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    getDeliveryPersons,
    getUserStats,
} = require('../controllers/userManagementController');

const router = express.Router();

// Get all users (with filters)
router.get('/', getAllUsers);

// Get user stats
router.get('/stats', getUserStats);

// Get delivery persons
router.get('/delivery-persons', getDeliveryPersons);

// Get user by ID
router.get('/:id', getUserById);

// Update user role
router.put('/:id/role', updateUserRole);

// Update user status
router.put('/:id/status', updateUserStatus);

// Delete user
router.delete('/:id', deleteUser);

module.exports = router;
