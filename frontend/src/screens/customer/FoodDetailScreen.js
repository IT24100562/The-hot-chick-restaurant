import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import colors from '../../styles/colors';
import { PremiumButton, PremiumCard } from '../../components';
import { buildFileUrl } from '../../utils/media';

const { width } = Dimensions.get('window');

export default function FoodDetailScreen({ navigation, route }) {
    const { foodId } = route.params;
    const { addToCart } = useCart();
    const { user } = useAuth();
    const [food, setFood] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFood();
        fetchReviews();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchReviews();
        }, [foodId])
    );

    const fetchFood = async () => {
        try {
            const res = await api.get(`/api/foods/${foodId}`);
            setFood(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const res = await api.get(`/api/reviews/food/${foodId}`);
            setReviews(res.data.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    const handleAddToCart = () => {
        if (!user) {
            Alert.alert('Login Required', 'Please login to add items to cart', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Login', onPress: () => navigation.navigate('Login') },
            ]);
            return;
        }

        for (let i = 0; i < quantity; i++) {
            addToCart(food);
        }

        Alert.alert('✅ Added to Cart', `${quantity}x ${food.name} added!`, [
            { text: 'Continue Shopping', style: 'cancel', onPress: handleBack },
            { text: 'View Cart', onPress: () => navigation.navigate('CustomerMain', { screen: 'Cart' }) },
        ]);
    };

    const handleOpenReviews = () => {
        navigation.navigate('Reviews', { foodId, foodName: food?.name || 'Food Item' });
    };

    const renderStars = (rating) => {
        const ratingNum = Number(rating || 0);
        return (
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                    <MaterialIcons
                        key={s}
                        name={s <= Math.round(ratingNum) ? 'star' : 'star-outline'}
                        size={14}
                        color={s <= Math.round(ratingNum) ? colors.gold : colors.textMuted}
                    />
                ))}
            </View>
        );
    };

    if (loading || !food) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <MaterialIcons name="restaurant" size={50} color={colors.primary} />
                    <Text style={styles.loadingText}>Loading food details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    {food.image ? (
                        <Image
                            source={{ uri: buildFileUrl(food.image, food.updatedAt || food.createdAt || food._id) }}
                            style={styles.heroImage}
                        />
                    ) : (
                        <View style={[styles.heroImage, { backgroundColor: colors.backgroundLight }]}>
                            <MaterialIcons name="restaurant" size={80} color={colors.textMuted} />
                        </View>
                    )}
                    <LinearGradient colors={['transparent', colors.background]} style={styles.heroOverlay}>
                        <View />
                    </LinearGradient>

                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <View style={styles.backButtonInner}>
                            <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>

                    {/* Badges Overlay */}
                    <View style={styles.badgesContainer}>
                        {food.isPopular && (
                            <View style={[styles.badge, { backgroundColor: '#FCD34D' }]}>
                                <MaterialIcons name="star" size={12} color="#78350F" />
                                <Text style={[styles.badgeText, { color: '#78350F' }]}>Popular</Text>
                            </View>
                        )}
                        {food.isVegetarian && (
                            <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
                                <MaterialIcons name="eco" size={12} color="#166534" />
                                <Text style={[styles.badgeText, { color: '#166534' }]}>Vegetarian</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.headerSection}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.foodName}>{food.name}</Text>
                            <Text style={styles.categoryLabel}>{food.category?.name || 'Uncategorized'}</Text>
                        </View>
                        <View style={styles.priceBox}>
                            <Text style={styles.priceLabel}>Price</Text>
                            <Text style={styles.priceValue}>Rs. {food.price}</Text>
                        </View>
                    </View>

                    {/* Quick Stats */}
                    <View style={styles.statsGrid}>
                        <PremiumCard variant="light" padding={12} marginVertical={0} marginHorizontal={0} style={styles.statCard}>
                            <View style={styles.statInner}>
                                <MaterialIcons name="star" size={18} color={colors.gold} />
                                <Text style={styles.statValue}>{Number(food.rating || 0).toFixed(1)}</Text>
                                <Text style={styles.statLabel}>Rating</Text>
                            </View>
                        </PremiumCard>
                        <PremiumCard variant="light" padding={12} marginVertical={0} marginHorizontal={0} style={styles.statCard}>
                            <View style={styles.statInner}>
                                <MaterialIcons name="schedule" size={18} color={colors.primary} />
                                <Text style={styles.statValue}>{food.prepTime || food.preparationTime || 0}m</Text>
                                <Text style={styles.statLabel}>Prep Time</Text>
                            </View>
                        </PremiumCard>
                        <PremiumCard variant="light" padding={12} marginVertical={0} marginHorizontal={0} style={styles.statCard}>
                            <View style={styles.statInner}>
                                <MaterialIcons name="local-fire-department" size={18} color="#EF4444" />
                                <Text style={styles.statValue}>{food.spiceLevel || 'Mild'}</Text>
                                <Text style={styles.statLabel}>Spice</Text>
                            </View>
                        </PremiumCard>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About This Dish</Text>
                        <Text style={styles.description}>{food.description}</Text>
                    </View>

                    {/* Ingredients */}
                    {food.ingredients && food.ingredients.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Key Ingredients</Text>
                            <View style={styles.ingredientsList}>
                                {food.ingredients.map((ingredient, index) => (
                                    <PremiumCard
                                        key={index}
                                        variant="light"
                                        padding={10}
                                        marginVertical={0}
                                        marginHorizontal={0}
                                        style={styles.ingredientTag}
                                    >
                                        <View style={styles.ingredientTagContent}>
                                            <MaterialIcons name="check-circle" size={14} color={colors.primary} />
                                            <Text style={styles.ingredientText}>{ingredient}</Text>
                                        </View>
                                    </PremiumCard>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Reviews Section */}
                    <View style={styles.section}>
                        <View style={styles.reviewsHeader}>
                            <Text style={styles.sectionTitle}>Customer Reviews</Text>
                            <View style={styles.reviewStars}>
                                {renderStars(food.rating)}
                                <Text style={styles.reviewCount}>({reviews.length})</Text>
                            </View>
                        </View>
                        <View style={styles.reviewActions}>
                            <TouchableOpacity style={styles.reviewActionBtn} onPress={handleOpenReviews}>
                                <Text style={styles.reviewActionText}>View Reviews</Text>
                            </TouchableOpacity>
                        </View>

                        {reviews.length > 0 ? (
                            <View style={styles.reviewsList}>
                                {reviews.slice(0, 4).map((review) => (
                                    <PremiumCard
                                        key={review._id}
                                        variant="light"
                                        padding={12}
                                        marginVertical={0}
                                        marginHorizontal={0}
                                        style={styles.reviewCard}
                                    >
                                        <View style={styles.reviewHeader}>
                                            <View style={styles.reviewerInfo}>
                                                <View style={styles.avatar}>
                                                    <Text style={styles.avatarText}>{review.user?.name?.[0]?.toUpperCase() || 'U'}</Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.reviewerName}>{review.user?.name}</Text>
                                                    {renderStars(review.rating)}
                                                </View>
                                            </View>
                                        </View>
                                        <Text style={styles.reviewText}>{review.comment}</Text>
                                        {review.adminReply && (
                                            <View style={styles.adminReply}>
                                                <View style={styles.adminReplyLabel}>
                                                    <MaterialIcons name="store" size={12} color={colors.primary} />
                                                    <Text style={styles.adminReplyTitle}>Restaurant's Response</Text>
                                                </View>
                                                <Text style={styles.adminReplyText}>{review.adminReply}</Text>
                                            </View>
                                        )}
                                    </PremiumCard>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.noReviews}>
                                <MaterialIcons name="chat-bubble-outline" size={40} color={colors.textMuted} />
                                <Text style={styles.noReviewsText}>No reviews yet</Text>
                                <Text style={styles.noReviewsSubtext}>Be the first to review this dish!</Text>
                            </View>
                        )}
                    </View>

                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.actionBar}>
                <View style={styles.quantityControl}>
                    <TouchableOpacity
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                        style={styles.qtyButton}
                    >
                        <MaterialIcons name="remove" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{quantity}</Text>
                    <TouchableOpacity
                        onPress={() => setQuantity(quantity + 1)}
                        style={styles.qtyButton}
                    >
                        <MaterialIcons name="add" size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <PremiumButton
                    title={`Add (Rs. ${(food.price * quantity).toFixed(0)})`}
                    onPress={handleAddToCart}
                    variant="primary"
                    size="lg"
                    style={{ flex: 1 }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: colors.textMuted,
        marginTop: 12,
        fontSize: 16,
    },
    heroContainer: {
        height: 320,
        position: 'relative',
        backgroundColor: colors.backgroundLight,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
    },
    backButton: {
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
    },
    backButtonInner: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgesContainer: {
        position: 'absolute',
        bottom: 12,
        left: 16,
        right: 16,
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    foodName: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    categoryLabel: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: '600',
    },
    priceBox: {
        alignItems: 'flex-end',
    },
    priceLabel: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '600',
    },
    priceValue: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.primary,
        marginTop: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
    },
    statInner: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 6,
    },
    statLabel: {
        fontSize: 10,
        color: colors.textMuted,
        marginTop: 2,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 12,
    },
    description: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    ingredientsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    ingredientTag: {
        marginVertical: 0,
        marginHorizontal: 0,
    },
    ingredientTagContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ingredientText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    reviewStars: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewCount: {
        fontSize: 12,
        color: colors.textMuted,
        marginLeft: 4,
    },
    reviewActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
        marginBottom: 6,
    },
    reviewActionBtn: {
        borderWidth: 1,
        borderColor: colors.glassBorder,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: colors.glassBg,
    },
    reviewPrimary: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    reviewActionText: {
        color: colors.textPrimary,
        fontSize: 12,
        fontWeight: '700',
    },
    reviewsList: {
        gap: 10,
    },
    reviewCard: {
        marginVertical: 0,
        marginHorizontal: 0,
    },
    reviewHeader: {
        marginBottom: 10,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    },
    reviewerName: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    reviewText: {
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    adminReply: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
    },
    adminReplyLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    adminReplyTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary,
    },
    adminReplyText: {
        fontSize: 11,
        color: colors.textSecondary,
        lineHeight: 16,
    },
    noReviews: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    noReviewsText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
        marginTop: 8,
    },
    noReviewsSubtext: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.backgroundLight,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    qtyButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginHorizontal: 8,
        minWidth: 20,
        textAlign: 'center',
    },
});
