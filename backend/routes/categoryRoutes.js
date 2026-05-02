const express = require('express');
const router = express.Router();
const {
	getCategories,
	getAllCategoriesAdmin,
	getCategory,
	createCategory,
	updateCategory,
	deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');

router.get('/', getCategories);
router.get('/admin/all', protect, admin, getAllCategoriesAdmin);
router.get('/:id', getCategory);
router.post('/', protect, admin, upload.single('image'), createCategory);
router.put('/:id', protect, admin, upload.single('image'), updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;
