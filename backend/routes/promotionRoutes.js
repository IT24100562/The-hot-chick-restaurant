const express = require('express');
const router = express.Router();
const { getPromotions, getAllPromotions, createPromotion, updatePromotion, deletePromotion } = require('../controllers/promotionController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/adminMiddleware');
const { uploadImage } = require('../middleware/upload');

const promotionUpload = uploadImage('promotions');

router.get('/', getPromotions);
router.get('/all', protect, admin, getAllPromotions);
router.post('/', protect, admin, promotionUpload.single('image'), createPromotion);
router.put('/:id', protect, admin, promotionUpload.single('image'), updatePromotion);
router.delete('/:id', protect, admin, deletePromotion);

module.exports = router;
