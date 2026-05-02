import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/axios';
import colors from '../../styles/colors';
import { PremiumCard } from '../../components';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
    pending: { color: '#FEF3C7', textColor: '#92400E', label: 'Pending' },
    preparing: { color: '#DBEAFE', textColor: '#1D4ED8', label: 'Preparing' },
    delivered: { color: '#DCFCE7', textColor: '#166534', label: 'Delivered' },
    cancelled: { color: '#FEE2E2', textColor: '#991B1B', label: 'Cancelled' },
};

export default function DeliveryDashboard({ navigation }) {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalOrders: 0,
        preparing: 0,
        delivered: 0,
    });

    useFocusEffect(
        React.useCallback(() => {
            fetchOrders();
        }, [])
    );

    const fetchOrders = async () => {
        try {
            const res = await api.get('/api/orders/delivery/my-orders');
            const fetchedOrders = res.data.data || [];
            setOrders(fetchedOrders);

            const stats = {
                totalOrders: fetchedOrders.length,
                preparing: fetchedOrders.filter(o => o.status === 'preparing').length,
                delivered: fetchedOrders.filter(o => o.status === 'delivered').length,
            };
            setStats(stats);
        } catch (error) {
            Alert.alert('Error', 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    const handleUpdateStatus = (orderId, currentStatus) => {
        if (currentStatus !== 'preparing') {
            Alert.alert('Info', `Order is already ${currentStatus}`);
            return;
        }

        const nextStatus = 'delivered';
        const statusLabel = STATUS_CONFIG.delivered.label;

        Alert.alert(
            'Update Status',
            `Mark this order as "${statusLabel}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            await api.put(`/api/orders/${orderId}/delivery-status`, { status: nextStatus });
                            Alert.alert('Success', `Order marked as ${statusLabel}`);
                            await fetchOrders();
                        } catch (error) {
                            const message = error.response?.data?.message || 'Failed to update status';
                            Alert.alert('Error', message);
                        }
                    },
                },
            ]
        );
    };

    const renderOrderCard = (order) => {
        const customer = order.userId;
        const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
        const itemsText = order.items?.length > 1 ? `${order.items.length} items` : '1 item';
        const canProgress = order.status === 'preparing';
        const nextButtonLabel = 'Mark Delivered';

        return (
            <PremiumCard key={order._id} variant="light" marginVertical={6} marginHorizontal={16}>
                <View style={styles.orderCardContent}>
                    {/* Header */}
                    <View style={styles.orderHeader}>
                        <View style={styles.orderInfo}>
                            <Text style={styles.orderNumber}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                            <Text style={styles.orderTime}>
                                {new Date(order.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                            <Text style={[styles.statusBadgeText, { color: statusConfig.textColor }]}>
                                {statusConfig.label}
                            </Text>
                        </View>
                    </View>

                    {/* Customer Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Customer Info</Text>
                        <View style={styles.customerBox}>
                            <Ionicons name="person" size={18} color={colors.primary} />
                            <View style={styles.customerDetails}>
                                <Text style={styles.customerName}>{customer?.name}</Text>
                                <Text style={styles.customerPhone}>{customer?.phone}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Delivery Address */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Delivery Address</Text>
                        <View style={styles.addressBox}>
                            <Ionicons name="location" size={18} color={colors.primary} />
                            <View style={styles.addressDetails}>
                                <Text style={styles.addressText} numberOfLines={2}>
                                    {order.deliveryAddress}
                                </Text>
                                {order.deliveryLocation?.latitude && (
                                    <TouchableOpacity style={styles.mapButton}>
                                        <Ionicons name="map" size={14} color={colors.primary} />
                                        <Text style={styles.mapButtonText}>View Map</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Order Items */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Order Items ({itemsText})</Text>
                        <View style={styles.itemsList}>
                            {order.items?.slice(0, 3).map((item, idx) => (
                                <View key={idx} style={styles.itemRow}>
                                    <Text style={styles.itemName} numberOfLines={1}>
                                        {item.name || item.food?.name}
                                    </Text>
                                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                                    <Text style={styles.itemPrice}>Rs. {(item.price * item.quantity).toFixed(0)}</Text>
                                </View>
                            ))}
                            {order.items?.length > 3 && (
                                <View style={styles.itemRow}>
                                    <Text style={styles.moreItems}>+{order.items.length - 3} more items</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Order Total */}
                    <View style={styles.totalBox}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalAmount}>Rs. {order.totalAmount.toFixed(0)}</Text>
                    </View>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                        <View style={styles.instructionsBox}>
                            <Ionicons name="information-circle" size={16} color={colors.primary} />
                            <Text style={styles.instructionsText} numberOfLines={2}>
                                {order.specialInstructions}
                            </Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    {canProgress && (
                        <TouchableOpacity
                            onPress={() => handleUpdateStatus(order._id, order.status)}
                            style={styles.progressButton}
                        >
                            <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                            <Text style={styles.progressButtonText}>{nextButtonLabel}</Text>
                        </TouchableOpacity>
                    )}

                    {order.status === 'delivered' && (
                        <View style={styles.completedBanner}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.completedText}>Order Completed</Text>
                        </View>
                    )}
                </View>
            </PremiumCard>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View>
                        <Text style={styles.greeting}>Delivery Dashboard</Text>
                        <Text style={styles.headerSubtitle}>Welcome, {user?.name}</Text>
                    </View>
                </View>
                <Ionicons name="bicycle" size={32} color={colors.primary} />
            </View>

            {/* Stats Cards */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statsContainer}
            >
                <PremiumCard variant="green" marginVertical={0} marginHorizontal={8} padding={12} style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalOrders}</Text>
                    <Text style={styles.statLabel}>Total Orders</Text>
                </PremiumCard>
                <PremiumCard variant="light" marginVertical={0} marginHorizontal={8} padding={12} style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.preparing}</Text>
                    <Text style={styles.statLabel}>Preparing</Text>
                </PremiumCard>
                <PremiumCard variant="light" marginVertical={0} marginHorizontal={8} padding={12} style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.delivered}</Text>
                    <Text style={styles.statLabel}>Delivered</Text>
                </PremiumCard>
            </ScrollView>

            {/* Orders List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="bicycle" size={50} color={colors.primary} />
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            ) : orders.length > 0 ? (
                <FlatList
                    data={orders}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => renderOrderCard(item)}
                    contentContainerStyle={styles.ordersList}
                    scrollEnabled={true}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
            ) : (
                <View style={styles.centerContainer}>
                    <Ionicons name="archive-outline" size={50} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>No Orders Yet</Text>
                    <Text style={styles.emptySubtext}>Orders will appear here when assigned by admin</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
        fontWeight: '500',
    },
    statsContainer: {
        paddingHorizontal: 8,
        paddingVertical: 12,
    },
    statCard: {
        minWidth: 110,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.primary,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textMuted,
        marginTop: 4,
    },
    ordersList: {
        paddingVertical: 12,
    },
    orderCardContent: {
        gap: 12,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    orderInfo: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    orderTime: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    section: {
        gap: 6,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    customerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 8,
    },
    customerDetails: {
        flex: 1,
    },
    customerName: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    customerPhone: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 1,
    },
    addressBox: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 8,
    },
    addressDetails: {
        flex: 1,
    },
    addressText: {
        fontSize: 12,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    mapButtonText: {
        fontSize: 11,
        color: colors.primary,
        fontWeight: '600',
    },
    itemsList: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        overflow: 'hidden',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
    },
    itemName: {
        flex: 1,
        fontSize: 12,
        color: colors.textPrimary,
    },
    itemQty: {
        fontSize: 11,
        color: colors.textMuted,
        marginHorizontal: 8,
    },
    itemPrice: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
    },
    moreItems: {
        fontSize: 11,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    totalBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
    },
    totalLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted,
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary,
    },
    instructionsBox: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
    },
    instructionsText: {
        flex: 1,
        fontSize: 11,
        color: '#92400E',
        fontWeight: '500',
    },
    progressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 12,
    },
    progressButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    completedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#DCFCE7',
        paddingVertical: 10,
        borderRadius: 8,
    },
    completedText: {
        color: '#166534',
        fontWeight: '700',
        fontSize: 13,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    loadingText: {
        color: colors.textMuted,
        marginTop: 12,
        fontSize: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textMuted,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 6,
        textAlign: 'center',
    },
});
