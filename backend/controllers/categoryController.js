const Category = require('../models/Category');
const { isAlphaSpace, trimSpaces } = require('../utils/validation');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        res.json({ success: true, count: categories.length, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all categories (admin)
// @route   GET /api/categories/admin/all
// @access  Admin
const getAllCategoriesAdmin = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ name: 1 });
        res.json({ success: true, count: categories.length, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Admin
const createCategory = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        const trimmedName = typeof name === 'string' ? trimSpaces(name) : '';

        if (!trimmedName) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        if (!isAlphaSpace(trimmedName)) {
            return res.status(400).json({ success: false, message: 'Category name can include only letters and spaces' });
        }

        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
        });

        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }

        let image = '';
        if (req.file) {
            image = `/uploads/${req.file.filename}`;
        }

        const category = await Category.create({
            name: trimmedName,
            description: typeof description === 'string' ? description.trim() : '',
            image,
            isActive: typeof isActive === 'string' ? isActive === 'true' : isActive !== undefined ? !!isActive : true,
        });
        res.status(201).json({ success: true, message: 'Category created', data: category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
const updateCategory = async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (typeof updateData.name === 'string') {
            const trimmedName = trimSpaces(updateData.name);
            if (!trimmedName) {
                return res.status(400).json({ success: false, message: 'Category name is required' });
            }

            if (!isAlphaSpace(trimmedName)) {
                return res.status(400).json({ success: false, message: 'Category name can include only letters and spaces' });
            }

            const duplicate = await Category.findOne({
                name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
                _id: { $ne: req.params.id },
            });

            if (duplicate) {
                return res.status(400).json({ success: false, message: 'Category already exists' });
            }

            updateData.name = trimmedName;
        }

        if (typeof updateData.description === 'string') {
            updateData.description = updateData.description.trim();
        }

        if (typeof updateData.isActive === 'string') {
            updateData.isActive = updateData.isActive === 'true';
        }

        if (req.file) {
            updateData.image = `/uploads/${req.file.filename}`;
        }

        const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, message: 'Category updated', data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getCategories,
    getAllCategoriesAdmin,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
};
