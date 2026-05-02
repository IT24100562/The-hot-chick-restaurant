const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

const userUpload = uploadImage('users');

router.post('/register', userUpload.single('avatar'), register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, userUpload.single('avatar'), updateProfile);

module.exports = router;
