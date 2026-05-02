import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import api, { API_BASE_URL } from '../../api/axios';
import colors from '../../styles/colors';
import {
    allowAlphaSpace,
    allowDecimal,
    allowNumeric,
    isAlphaSpace,
    isDecimal,
    trimSpaces,
} from '../../utils/validation';

export default function AddEditFood({ navigation, route }) {
    const editFood = route?.params?.food;
    const isEditing = !!editFood;

    const [name, setName] = useState(editFood?.name || '');
    const [description, setDescription] = useState(editFood?.description || '');
    const [price, setPrice] = useState(editFood?.price?.toString() || '');
    const [category, setCategory] = useState(editFood?.category?._id || editFood?.category || '');
    const [spiceLevel, setSpiceLevel] = useState(editFood?.spiceLevel || 'medium');
    const [isVegetarian, setIsVegetarian] = useState(editFood?.isVegetarian || false);
    const [preparationTime, setPreparationTime] = useState(editFood?.preparationTime?.toString() || '20');
    const [ingredients, setIngredients] = useState(editFood?.ingredients?.join(', ') || '');
    const [image, setImage] = useState(null);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        preparationTime: '',
    });

    const validateField = (field, value) => {
        if (['name', 'description', 'price', 'category'].includes(field) && !value?.toString().trim()) {
            return 'This field is required.';
        }

        if (field === 'name' && value && !isAlphaSpace(value)) {
            return 'Name can include only letters and spaces.';
        }

        if (field === 'price' && value && !isDecimal(value)) {
            return 'Enter a valid price.';
        }

        if (field === 'preparationTime' && value && !/^[0-9]+$/.test(value)) {
            return 'Preparation time must be numeric.';
        }

        return '';
    };

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        setCategoriesLoading(true);
        try {
            const res = await api.get('/api/categories/admin/all');
            const categoryList = res.data.data || [];
            setCategories(categoryList);

            // Auto-select first category for new food items.
            if (!isEditing && !category && categoryList.length > 0) {
                const firstActive = categoryList.find((item) => item.isActive !== false);
                if (firstActive) {
                    setCategory(firstActive._id);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled) setImage(result.assets[0]);
    };

    const handleSubmit = async () => {
        const nextErrors = {
            name: validateField('name', name),
            description: validateField('description', description),
            price: validateField('price', price),
            category: validateField('category', category),
            preparationTime: validateField('preparationTime', preparationTime),
        };

        setErrors(nextErrors);

        if (Object.values(nextErrors).some((value) => value)) {
            return;
        }

        if (categories.length === 0) {
            Alert.alert(
                'Category Required',
                'No categories found. Please create a category first.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Create Category', onPress: () => navigation.navigate('ManageCategories') },
                ]
            );
            return;
        }

        if (!category) {
            Alert.alert('Category Required', 'Please select a category');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', trimSpaces(name));
            formData.append('description', trimSpaces(description));
            formData.append('price', parseFloat(price));
            formData.append('category', category);
            formData.append('spiceLevel', spiceLevel);
            formData.append('isVegetarian', isVegetarian);
            formData.append('preparationTime', parseInt(preparationTime || '0'));
            if (ingredients) formData.append('ingredients', JSON.stringify(ingredients.split(',').map((i) => i.trim())));

            if (image) {
                const fileName = image.uri.split('/').pop();
                const ext = fileName.split('.').pop();
                formData.append('image', {
                    uri: image.uri,
                    name: fileName,
                    type: `image/${ext}`,
                });
            }

            if (isEditing) {
                await api.put(`/api/foods/${editFood._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                Alert.alert('Success', 'Food item updated successfully');
            } else {
                await api.post('/api/foods', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                Alert.alert('Success', 'Food item created successfully');
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to save food item');
        } finally {
            setLoading(false);
        }
    };

    const spiceLevels = ['no-spice', 'mild', 'medium', 'hot', 'extra-hot'];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>{isEditing ? 'Edit Food' : 'Add Food'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
                {/* Image Picker */}
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {image ? (
                        <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                    ) : editFood?.image ? (
                        <Image source={{ uri: `${API_BASE_URL}${editFood.image}` }} style={styles.selectedImage} />
                    ) : (
                        <View style={styles.imagePickerContent}>
                            <Ionicons name="camera" size={36} color={colors.textMuted} />
                            <Text style={styles.imagePickerText}>Tap to add photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.label}>Name *</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={(value) => {
                        const normalized = trimSpaces(allowAlphaSpace(value));
                        setName(normalized);
                        setErrors((prev) => ({ ...prev, name: validateField('name', normalized) }));
                    }}
                    placeholder="Food name"
                    placeholderTextColor={colors.textMuted}
                />
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

                <Text style={styles.label}>Description *</Text>
                <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    value={description}
                    onChangeText={(value) => {
                        setDescription(value);
                        setErrors((prev) => ({ ...prev, description: validateField('description', value) }));
                    }}
                    placeholder="Food description"
                    placeholderTextColor={colors.textMuted}
                    multiline
                />
                {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}

                <Text style={styles.label}>Price (Rs.) *</Text>
                <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={(value) => {
                        const normalized = allowDecimal(value);
                        setPrice(normalized);
                        setErrors((prev) => ({ ...prev, price: validateField('price', normalized) }));
                    }}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                />
                {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}

                <Text style={styles.label}>Category *</Text>
                {categoriesLoading ? (
                    <View style={styles.helperBox}>
                        <Text style={styles.helperText}>Loading categories...</Text>
                    </View>
                ) : categories.length === 0 ? (
                    <View style={styles.helperBox}>
                        <Text style={styles.helperText}>No categories available. Create one to add food.</Text>
                        <TouchableOpacity style={styles.helperBtn} onPress={() => navigation.navigate('ManageCategories')}>
                            <Text style={styles.helperBtnText}>Go to Categories</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                        {categories.map((cat) => (
                            <View key={cat._id}>
                            <TouchableOpacity
                                style={[
                                    styles.chip,
                                    category === cat._id && styles.chipActive,
                                    cat.isActive === false && styles.chipDisabled,
                                ]}
                                onPress={() => {
                                    if (cat.isActive === false) {
                                        Alert.alert('Inactive Category', 'Please activate this category before assigning it to food items.');
                                        return;
                                    }
                                    setCategory(cat._id);
                                    setErrors((prev) => ({ ...prev, category: '' }));
                                }}
                                disabled={cat.isActive === false}
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        category === cat._id && styles.chipTextActive,
                                        cat.isActive === false && styles.chipTextDisabled,
                                    ]}
                                >
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
                {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

                <Text style={styles.label}>Spice Level</Text>
                <View style={styles.chipRow}>
                    {spiceLevels.map((level) => (
                        <TouchableOpacity
                            key={level}
                            style={[styles.chip, spiceLevel === level && { backgroundColor: colors[level], borderColor: colors[level] }]}
                            onPress={() => setSpiceLevel(level)}
                        >
                            <Text style={[styles.chipText, spiceLevel === level && { color: '#FFF' }]}>🌶 {level}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.toggleRow} onPress={() => setIsVegetarian(!isVegetarian)}>
                    <Text style={styles.label}>Vegetarian</Text>
                    <Ionicons name={isVegetarian ? 'checkbox' : 'square-outline'} size={24} color={isVegetarian ? colors.success : colors.textMuted} />
                </TouchableOpacity>

                <Text style={styles.label}>Preparation Time (minutes)</Text>
                <TextInput
                    style={styles.input}
                    value={preparationTime}
                    onChangeText={(value) => {
                        const normalized = allowNumeric(value).slice(0, 3);
                        setPreparationTime(normalized);
                        setErrors((prev) => ({
                            ...prev,
                            preparationTime: validateField('preparationTime', normalized),
                        }));
                    }}
                    placeholder="20"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                />
                {errors.preparationTime ? <Text style={styles.errorText}>{errors.preparationTime}</Text> : null}

                <Text style={styles.label}>Ingredients (comma separated)</Text>
                <TextInput style={styles.input} value={ingredients} onChangeText={setIngredients} placeholder="Rice, Chicken, Spices" placeholderTextColor={colors.textMuted} />

                <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
                    <LinearGradient colors={colors.gradientPrimary} style={styles.submitGradient}>
                        <Text style={styles.submitText}>{loading ? 'Saving...' : isEditing ? 'Update Food' : 'Add Food'}</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 12,
    },
    title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
    form: { paddingHorizontal: 20 },
    imagePicker: {
        height: 180, borderRadius: 18, overflow: 'hidden', marginBottom: 20,
        backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder, borderStyle: 'dashed',
    },
    selectedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    imagePickerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    imagePickerText: { color: colors.textMuted, marginTop: 8, fontSize: 13 },
    label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 4 },
    input: {
        backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder,
        borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: colors.textPrimary,
        fontSize: 15, marginBottom: 12,
    },
    errorText: { color: colors.danger, fontSize: 11, marginTop: -8, marginBottom: 10 },
    chipScroll: { marginBottom: 12 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
        backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder, marginRight: 8,
    },
    helperBox: {
        backgroundColor: colors.glassBg,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    helperText: {
        color: colors.textSecondary,
        fontSize: 13,
    },
    helperBtn: {
        marginTop: 10,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,107,53,0.2)',
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    helperBtnText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 12,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipDisabled: { backgroundColor: colors.backgroundElevated, borderColor: colors.glassBorder, opacity: 0.6 },
    chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: '#FFF' },
    chipTextDisabled: { color: colors.textMuted },
    toggleRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
    },
    submitBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 16 },
    submitGradient: { paddingVertical: 16, alignItems: 'center' },
    submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
