import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import colors from '../../styles/colors';
import { useAuth } from '../../context/AuthContext';

const statusConfig = {
    pending: { icon: 'time', color: colors.pending, label: 'Pending' },
    preparing: { icon: 'restaurant', color: colors.preparing, label: 'Preparing' },
    delivered: { icon: 'bicycle', color: colors.delivered, label: 'Delivered' },
    cancelled: { icon: 'close-circle', color: colors.cancelled, label: 'Cancelled' },
};

const paymentConfig = {
    cash: { label: 'Cash on Delivery', color: colors.success, icon: 'cash-outline' },
    online: { label: 'Online Transfer', color: colors.info, icon: 'phone-portrait-outline' },
    card: { label: 'Card Payment', color: colors.primary, icon: 'card-outline' },
};

const ORDER_EDIT_WINDOW_MS = 5 * 60 * 1000;

export default function OrderScreen({ navigation }) {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingOrderId, setEditingOrderId] = useState(null);
    const [editAddress, setEditAddress] = useState('');
    const [editInstructions, setEditInstructions] = useState('');
    const [submittingEdit, setSubmittingEdit] = useState(false);
    const [orderReviews, setOrderReviews] = useState({});

    useEffect(() => {
        if (user) {
            fetchOrders();
        } else {
            setOrders([]);
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/api/orders');
            setOrders(res.data.data || []);
            await fetchOrderReviews();
        } catch (e) {
            Alert.alert('Error', e.userMessage || 'Failed to load orders');
        }
    };

    const fetchOrderReviews = async () => {
        try {
            const res = await api.get('/api/reviews/my-orders');
            const reviews = res.data.data || [];
            const reviewMap = reviews.reduce((acc, review) => {
                acc[review.order] = review;
                return acc;
            }, {});
            setOrderReviews(reviewMap);
        } catch (_) {
            setOrderReviews({});
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    const getRemainingWindowMs = (createdAt) => {
        const elapsed = Date.now() - new Date(createdAt).getTime();
        return Math.max(0, ORDER_EDIT_WINDOW_MS - elapsed);
    };

    const canModifyOrder = (order) => {
        return order.status === 'pending' && getRemainingWindowMs(order.createdAt) > 0;
    };

    const getRemainingMinutesText = (order) => {
        const minutes = Math.ceil(getRemainingWindowMs(order.createdAt) / 60000);
        return `${minutes} min left to edit/delete`;
    };

    const openEditModal = (order) => {
        setEditingOrderId(order._id);
        setEditAddress(order.deliveryAddress || '');
        setEditInstructions(order.specialInstructions || '');
        setEditModalVisible(true);
    };

    const closeEditModal = () => {
        setEditModalVisible(false);
        setEditingOrderId(null);
        setEditAddress('');
        setEditInstructions('');
    };

    const handleSaveOrderUpdate = async () => {
        if (!editingOrderId) return;

        try {
            setSubmittingEdit(true);
            await api.put(`/api/orders/${editingOrderId}`, {
                deliveryAddress: editAddress,
                specialInstructions: editInstructions,
            });

            closeEditModal();
            await fetchOrders();
            Alert.alert('Updated', 'Your order has been updated.');
        } catch (error) {
            Alert.alert('Update Failed', error?.response?.data?.message || 'Could not update this order.');
        } finally {
            setSubmittingEdit(false);
        }
    };

    const handleDeleteOrder = (order) => {
        Alert.alert(
            'Delete Order',
            'Are you sure you want to delete this order?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/api/orders/${order._id}`);
                            await fetchOrders();
                            Alert.alert('Deleted', 'Order deleted successfully.');
                        } catch (error) {
                            Alert.alert('Delete Failed', error?.response?.data?.message || 'Could not delete this order.');
                        }
                    },
                },
            ]
        );
    };

    const renderOrder = ({ item }) => {
        const status = statusConfig[item.status] || statusConfig.pending;
        const editable = canModifyOrder(item);
        return (
            <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <View>
                        <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                        <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                        <Ionicons name={status.icon} size={14} color={status.color} />
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>
                <View style={styles.divider} />
                {item.items.map((orderItem, index) => (
                    <View key={index} style={styles.orderItem}>
                        <Text style={styles.itemQty}>{orderItem.quantity}x</Text>
                        <Text style={styles.itemName}>{orderItem.name || 'Food Item'}</Text>
                        <Text style={styles.itemPrice}>Rs. {(orderItem.price * orderItem.quantity).toFixed(2)}</Text>
                    </View>
                ))}
                <View style={styles.divider} />
                <View style={styles.orderFooter}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>Rs. {item.totalAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.paymentRow}>
                    <View style={[styles.paymentBadge, { backgroundColor: `${(paymentConfig[item.paymentMethod] || paymentConfig.cash).color}18` }]}>
                        <Ionicons name={(paymentConfig[item.paymentMethod] || paymentConfig.cash).icon} size={12} color={(paymentConfig[item.paymentMethod] || paymentConfig.cash).color} />
                        <Text style={[styles.paymentText, { color: (paymentConfig[item.paymentMethod] || paymentConfig.cash).color }]}>
                            {(paymentConfig[item.paymentMethod] || paymentConfig.cash).label}
                        </Text>
                    </View>
                    <View style={[styles.paymentBadge, { backgroundColor: `${colors.textMuted}18` }]}>
                        <Text style={[styles.paymentText, { color: colors.textMuted }]}>Payment: {item.paymentStatus || 'pending'}</Text>
                    </View>
                </View>
                {!!item.specialInstructions && (
                    <Text style={styles.instructionsText}>Note: {item.specialInstructions}</Text>
                )}
                {editable ? (
                    <>
                        <Text style={styles.windowHint}>{getRemainingMinutesText(item)}</Text>
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
                                <Ionicons name="create-outline" size={14} color="#FFFFFF" />
                                <Text style={styles.actionButtonText}>Update</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteOrder(item)}>
                                <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                                <Text style={styles.actionButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <Text style={styles.windowExpiredText}>Order update/delete is available for 5 minutes after placing the order.</Text>
                )}

                {item.status === 'delivered' && !orderReviews[item._id] && (
                    <TouchableOpacity
                        style={styles.reviewButton}
                        onPress={() => navigation.navigate('Reviews', { orderId: item._id })}
                    >
                        <Ionicons name="star" size={16} color="#FFFFFF" />
                        <Text style={styles.reviewButtonText}>Write Review</Text>
                    </TouchableOpacity>
                )}
                {item.status === 'delivered' && orderReviews[item._id] && (
                    <View style={styles.reviewSubmitted}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        <Text style={styles.reviewSubmittedText}>Review submitted</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {!user ? (
                <View style={styles.guestState}>
                    <Ionicons name="lock-closed-outline" size={66} color={colors.textMuted} />
                    <Text style={styles.guestTitle}>Login Required</Text>
                    <Text style={styles.guestSubtext}>Sign in to view your order history</Text>
                    <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginButtonText}>Login / Sign Up</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
            <View style={styles.header}>
                <Text style={styles.title}>My Orders</Text>
                <Text style={styles.subtitle}>{orders.length} orders</Text>
            </View>
            <FlatList
                data={orders}
                keyExtractor={(item) => item._id}
                renderItem={renderOrder}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={70} color={colors.textMuted} />
                        <Text style={styles.emptyText}>No orders yet</Text>
                        <Text style={styles.emptySubtext}>Your order history will appear here</Text>
                    </View>
                }
            />
            <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={closeEditModal}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Update Order</Text>
                        <Text style={styles.modalLabel}>Delivery Address</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editAddress}
                            onChangeText={setEditAddress}
                            placeholder="Enter delivery address"
                            placeholderTextColor={colors.textMuted}
                        />
                        <Text style={styles.modalLabel}>Special Instructions</Text>
                        <TextInput
                            style={[styles.modalInput, styles.modalInputMultiline]}
                            value={editInstructions}
                            onChangeText={setEditInstructions}
                            placeholder="Any notes for your order"
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={3}
                        />
                        <View style={styles.modalActionRow}>
                            <TouchableOpacity style={styles.modalCancelButton} onPress={closeEditModal} disabled={submittingEdit}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveOrderUpdate} disabled={submittingEdit}>
                                <Text style={styles.modalSaveText}>{submittingEdit ? 'Saving...' : 'Save'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
    title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
    subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    list: { paddingHorizontal: 16, paddingBottom: 100 },
    orderCard: {
        backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder,
        borderRadius: 18, padding: 16, marginBottom: 14,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderId: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    orderDate: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    },
    statusText: { fontSize: 12, fontWeight: '700' },
    divider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: 12 },
    orderItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    itemQty: { fontSize: 13, color: colors.primary, fontWeight: '700', width: 30 },
    itemName: { flex: 1, fontSize: 13, color: colors.textSecondary },
    itemPrice: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 15, color: colors.textPrimary, fontWeight: '600' },
    totalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
    paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    paymentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    instructionsText: {
        marginTop: 10,
        fontSize: 12,
        color: colors.textSecondary,
    },
    windowHint: {
        marginTop: 10,
        fontSize: 12,
        color: colors.warning,
        fontWeight: '700',
    },
    windowExpiredText: {
        marginTop: 10,
        fontSize: 12,
        color: colors.textMuted,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    editButton: {
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    deleteButton: {
        backgroundColor: colors.danger,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    reviewButton: {
        marginTop: 10,
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
    },
    reviewButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    },
    reviewSubmitted: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    reviewSubmittedText: {
        color: colors.success,
        fontWeight: '700',
        fontSize: 12,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    },
    paymentText: { fontSize: 11, fontWeight: '700' },
    emptyState: { alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
    emptySubtext: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    guestState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    guestTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 14,
    },
    guestSubtext: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 6,
    },
    loginButton: {
        marginTop: 20,
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingHorizontal: 22,
        paddingVertical: 12,
    },
    loginButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalCard: {
        backgroundColor: colors.backgroundLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 10,
    },
    modalLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 6,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: colors.textPrimary,
        marginBottom: 10,
        backgroundColor: colors.background,
    },
    modalInputMultiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalActionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 8,
    },
    modalCancelButton: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.background,
    },
    modalCancelText: {
        color: colors.textSecondary,
        fontWeight: '700',
    },
    modalSaveButton: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: colors.primary,
    },
    modalSaveText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
