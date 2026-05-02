import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import colors from '../../styles/colors';
import { PremiumButton, PremiumCard } from '../../components';

export default function ReviewScreen({ navigation, route }) {
    const { foodId, foodName, orderId } = route.params || {};
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [orderReview, setOrderReview] = useState(null);
    const [errors, setErrors] = useState({ rating: '', comment: '' });

    useEffect(() => {
        if (foodId) {
            fetchReviews();
        }
        if (orderId) {
            fetchOrderReview();
        }
    }, [foodId, orderId]);

    const fetchReviews = async () => {
        try {
            const res = await api.get(`/api/reviews/food/${foodId}`);
            setReviews(res.data.data || []);
        } catch (e) {
            Alert.alert('Error', 'Failed to load reviews');
        }
    };

    const fetchOrderReview = async () => {
        try {
            const res = await api.get(`/api/reviews/order/${orderId}`);
            setOrderReview(res.data.data);
        } catch (e) {
            setOrderReview(null);
        }
    };

    const averageRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        const total = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
        return total / reviews.length;
    }, [reviews]);

    const handleSubmit = async () => {
        if (!user) {
            Alert.alert('Login Required', 'Please login to write a review', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Login', onPress: () => navigation.navigate('Login') },
            ]);
            return;
        }

        if (rating < 1) {
            setErrors((prev) => ({ ...prev, rating: 'Please select a rating.' }));
            return;
        }

        if (!comment.trim()) {
            setErrors((prev) => ({ ...prev, comment: 'Please write your review.' }));
            return;
        }

        if (comment.trim().length < 10 || comment.trim().length > 300) {
            setErrors((prev) => ({
                ...prev,
                comment: 'Review must be 10-300 characters long.',
            }));
            return;
        }

        try {
            setSubmitting(true);
            await api.post('/api/reviews', { orderId, food: foodId, rating, comment: comment.trim() });
            setOrderReview({ rating, comment: comment.trim(), createdAt: new Date().toISOString() });
            setRating(0);
            setComment('');
            if (foodId) {
                await fetchReviews();
            }
            Alert.alert('Thank you!', 'Your review has been submitted');
        } catch (e) {
            const message = e.response?.data?.message || 'Failed to submit review';
            Alert.alert('Error', message);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (value, onPress) => (
        <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => onPress(s)}>
                    <MaterialIcons
                        name={s <= value ? 'star' : 'star-outline'}
                        size={22}
                        color={s <= value ? colors.gold : colors.textMuted}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Reviews</Text>
                <Text style={styles.subtitle}>{foodName || 'Order Review'}</Text>
            </View>

            <View style={styles.summaryCard}>
                <View style={styles.summaryLeft}>
                    <Text style={styles.avgValue}>{averageRating.toFixed(1)}</Text>
                    {renderStars(Math.round(averageRating), () => {})}
                    <Text style={styles.countText}>{reviews.length} reviews</Text>
                </View>
                <View style={styles.summaryRight}>
                    <Text style={styles.writeTitle}>Write a review</Text>
                    {orderReview ? (
                        <View style={styles.reviewSummaryBox}>
                            {renderStars(orderReview.rating, () => {})}
                            <Text style={styles.reviewSummaryText}>{orderReview.comment}</Text>
                            <Text style={styles.reviewSummaryDate}>
                                {new Date(orderReview.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    ) : (
                        <>
                            {renderStars(rating, (value) => {
                                setRating(value);
                                setErrors((prev) => ({ ...prev, rating: '' }));
                            })}
                            {errors.rating ? <Text style={styles.errorText}>{errors.rating}</Text> : null}
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Share your experience (10-300 chars)"
                                placeholderTextColor={colors.textMuted}
                                value={comment}
                                onChangeText={(value) => {
                                    setComment(value);
                                    if (!value.trim()) {
                                        setErrors((prev) => ({ ...prev, comment: 'Please write your review.' }));
                                        return;
                                    }
                                    if (value.trim().length < 10 || value.trim().length > 300) {
                                        setErrors((prev) => ({
                                            ...prev,
                                            comment: 'Review must be 10-300 characters long.',
                                        }));
                                        return;
                                    }
                                    setErrors((prev) => ({ ...prev, comment: '' }));
                                }}
                                multiline
                                maxLength={300}
                            />
                            {errors.comment ? <Text style={styles.errorText}>{errors.comment}</Text> : null}
                            <PremiumButton
                                title={submitting ? 'Submitting...' : 'Submit Review'}
                                onPress={handleSubmit}
                                variant="primary"
                                size="md"
                                disabled={submitting}
                            />
                        </>
                    )}
                </View>
            </View>

            <FlatList
                data={reviews}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <PremiumCard variant="light" padding={12} marginVertical={0} marginHorizontal={0} style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{item.user?.name?.[0]?.toUpperCase() || 'U'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.reviewerName}>{item.user?.name || 'User'}</Text>
                                {renderStars(item.rating, () => {})}
                            </View>
                            <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        </View>
                        <Text style={styles.reviewText}>{item.comment}</Text>
                        {item.adminReply ? (
                            <View style={styles.adminReply}>
                                <View style={styles.adminReplyLabel}>
                                    <MaterialIcons name="store" size={12} color={colors.primary} />
                                    <Text style={styles.adminReplyTitle}>Restaurant's Response</Text>
                                </View>
                                <Text style={styles.adminReplyText}>{item.adminReply}</Text>
                            </View>
                        ) : null}
                    </PremiumCard>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialIcons name="chat-bubble-outline" size={40} color={colors.textMuted} />
                        <Text style={styles.emptyText}>No reviews yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },
    title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
    subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    summaryCard: { marginHorizontal: 16, marginTop: 6, padding: 12, backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 16, flexDirection: 'row', gap: 16 },
    summaryLeft: { width: 120, alignItems: 'center', justifyContent: 'center' },
    avgValue: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
    countText: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
    summaryRight: { flex: 1 },
    writeTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
    starsRow: { flexDirection: 'row', gap: 2, marginBottom: 8 },
    commentInput: { minHeight: 70, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12, padding: 10, color: colors.textPrimary, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 10 },
    errorText: { color: colors.danger, fontSize: 11, marginBottom: 8 },
    reviewSummaryBox: { backgroundColor: 'rgba(22,163,74,0.08)', borderRadius: 12, padding: 10, marginBottom: 10 },
    reviewSummaryText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginTop: 6 },
    reviewSummaryDate: { fontSize: 10, color: colors.textMuted, marginTop: 6 },
    list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 },
    reviewCard: { marginBottom: 10 },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    avatar: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    reviewerName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
    reviewDate: { fontSize: 10, color: colors.textMuted },
    reviewText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
    adminReply: { backgroundColor: 'rgba(22,163,74,0.08)', borderRadius: 10, padding: 10, marginTop: 8, borderLeftWidth: 3, borderLeftColor: colors.primary },
    adminReplyLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    adminReplyTitle: { fontSize: 11, color: colors.primary, fontWeight: '700' },
    adminReplyText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
    empty: { alignItems: 'center', paddingTop: 40 },
    emptyText: { color: colors.textMuted, marginTop: 8 },
});
