const Food = require('../models/Food');
const { isAlphaSpace, isDecimal, isNumeric, trimSpaces } = require('../utils/validation');

// @desc    Get all foods
// @route   GET /api/foods
// @access  Public
const getFoods = async (req, res) => {
    try {
        const { category, search, spiceLevel, isVegetarian, available } = req.query;
        let query = {};

        if (category) query.category = category;
        if (spiceLevel) query.spiceLevel = spiceLevel;
        if (isVegetarian) query.isVegetarian = isVegetarian === 'true';
        if (available !== undefined) query.isAvailable = available === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const foods = await Food.find(query).populate('category', 'name').sort({ createdAt: -1 });

        res.json({
            success: true,
            count: foods.length,
            data: foods,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single food
// @route   GET /api/foods/:id
// @access  Public
const getFood = async (req, res) => {
    try {
        const food = await Food.findById(req.params.id).populate('category', 'name');
        if (!food) {
            return res.status(404).json({ success: false, message: 'Food not found' });
        }
        res.json({ success: true, data: food });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create food
// @route   POST /api/foods
// @access  Admin
const createFood = async (req, res) => {
    try {
        const { name, description, price, category, spiceLevel, isVegetarian, preparationTime, ingredients } = req.body;

        const trimmedName = trimSpaces(name);
        const trimmedDescription = trimSpaces(description);

        if (!trimmedName || !trimmedDescription || price === undefined || !category) {
            return res.status(400).json({ success: false, message: 'Name, description, price, and category are required' });
        }

        if (!isAlphaSpace(trimmedName)) {
            return res.status(400).json({ success: false, message: 'Name can include only letters and spaces' });
        }

        if (!isDecimal(price)) {
            return res.status(400).json({ success: false, message: 'Invalid price format' });
        }

        if (preparationTime !== undefined && !isNumeric(preparationTime)) {
            return res.status(400).json({ success: false, message: 'Preparation time must be numeric' });
        }

        let image = '';
        if (req.file) {
            image = `/uploads/${req.file.filename}`;
        }

        const food = await Food.create({
            name: trimmedName,
            description: trimmedDescription,
            price,
            image,
            category,
            spiceLevel: spiceLevel || 'medium',
            isVegetarian: isVegetarian || false,
            preparationTime: preparationTime || 20,
            ingredients: ingredients ? (typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients) : [],
        });

        const populatedFood = await food.populate('category', 'name');

        res.status(201).json({
            success: true,
            message: 'Food item created successfully',
            data: populatedFood,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update food
// @route   PUT /api/foods/:id
// @access  Admin
const updateFood = async (req, res) => {
    try {
        let food = await Food.findById(req.params.id);
        if (!food) {
            return res.status(404).json({ success: false, message: 'Food not found' });
        }

        const updateData = { ...req.body };
        if (updateData.name !== undefined) {
            const trimmedName = trimSpaces(updateData.name);
            if (!trimmedName) {
                return res.status(400).json({ success: false, message: 'Name is required' });
            }
            if (!isAlphaSpace(trimmedName)) {
                return res.status(400).json({ success: false, message: 'Name can include only letters and spaces' });
            }
            updateData.name = trimmedName;
        }

        if (updateData.description !== undefined) {
            const trimmedDescription = trimSpaces(updateData.description);
            if (!trimmedDescription) {
                return res.status(400).json({ success: false, message: 'Description is required' });
            }
            updateData.description = trimmedDescription;
        }

        if (updateData.price !== undefined && !isDecimal(updateData.price)) {
            return res.status(400).json({ success: false, message: 'Invalid price format' });
        }

        if (updateData.preparationTime !== undefined && !isNumeric(updateData.preparationTime)) {
            return res.status(400).json({ success: false, message: 'Preparation time must be numeric' });
        }
        if (req.file) {
            updateData.image = `/uploads/${req.file.filename}`;
        }
        if (updateData.ingredients && typeof updateData.ingredients === 'string') {
            updateData.ingredients = JSON.parse(updateData.ingredients);
        }

        food = await Food.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate('category', 'name');

        res.json({
            success: true,
            message: 'Food item updated successfully',
            data: food,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete food
// @route   DELETE /api/foods/:id
// @access  Admin
const deleteFood = async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);
        if (!food) {
            return res.status(404).json({ success: false, message: 'Food not found' });
        }

        await Food.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Food item deleted successfully',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getFoods, getFood, createFood, updateFood, deleteFood };
