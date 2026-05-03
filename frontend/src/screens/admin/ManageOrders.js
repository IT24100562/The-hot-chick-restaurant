
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import colors from '../../styles/colors';


const allStatuses = ['pending', 'preparing', 'delivered', 'cancelled'];
const statusConfig = {

    pending: { icon: 'time', color: colors.pending },
    preparing: { icon: 'restaurant', color: colors.preparing },
    delivered: { icon: 'bicycle', color: colors.delivered },
    cancelled: { icon: 'close-circle', color: colors.cancelled },

};

const getNextStatuses = (currentStatus) => {

    if (currentStatus === 'pending') return ['preparing', 'cancelled'];
    if (currentStatus === 'preparing') return ['delivered', 'cancelled'];
    return [];

};

export default function ManageOrders() {

    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [deliveryUsers, setDeliveryUsers] = useState([]);

    useEffect(() => { fetchOrders(); }, [filter]);
    useEffect(() => { fetchDeliveryUsers(); }, []);

    const fetchOrders = async () => {
        try {
            let url = '/api/orders/all';
            if (filter) url += `?status=${filter}`;
            const res = await api.get(url);
            setOrders(res.data.data || []);
        } catch (e) {
            Alert.alert('Error', e.userMessage || 'Failed to load orders');
        }

    };

    const fetchDeliveryUsers = async () => {

        try {
            const res = await api.get('/api/users');
            const deliveryOnly = (res.data.data || []).filter((u) => u.role === 'delivery');
            setDeliveryUsers(deliveryOnly);
        } catch (e) {
            Alert.alert('Error', e.userMessage || 'Failed to load delivery users');
        }

    };

    const onRefresh = async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false); };

    const updateStatus = (orderId, currentStatus) => {

        const nextStatuses = getNextStatuses(currentStatus);
        if (nextStatuses.length === 0) {
            Alert.alert('Info', `Order is already ${currentStatus}`);
            return;
        }
        Alert.alert('Update Status', 'Select new status', [
            ...nextStatuses.map((status) => ({
                text: status.charAt(0).toUpperCase() + status.slice(1),
                onPress: async () => {
                    try { await api.put(`/api/orders/${orderId}/status`, { status }); fetchOrders(); }
                    catch (e) { Alert.alert('Error', e.userMessage || 'Failed to update'); }
                },
            })),

            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const assignDelivery = (orderId) => {

        if (deliveryUsers.length === 0) {
            Alert.alert('No Delivery Users', 'Create a delivery user first in Manage Users.');
            return;
        }

        Alert.alert(

            'Assign Delivery',
            'Select a delivery person',
            [
                ...deliveryUsers.map((user) => ({
                    text: user.name || user.email,
                    onPress: async () => {
                        try {
                            await api.put(`/api/orders/${orderId}/assign-delivery`, { deliveryPersonId: user._id });
                            fetchOrders();
                        } catch (e) {
                            Alert.alert('Error', 'Failed to assign delivery person');
                        }
                    },
                })),
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Orders</Text>
                <Text style={styles.count}>{orders.length}</Text>
            </View>

            <FlatList
                horizontal data={[{ _id: null, name: 'All' }, ...allStatuses.map((s) => ({ _id: s, name: s }))]}
                keyExtractor={(item) => item._id || 'all'}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterList}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.filterChip, filter === item._id && styles.filterActive]}
                        onPress={() => setFilter(item._id)}
                    >
                        <Text style={[styles.filterText, filter === item._id && { color: '#FFF' }]}>
                            {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            <FlatList
                data={orders}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                renderItem={({ item }) => {
                    const sc = statusConfig[item.status] || statusConfig.pending;
                    return (
                        <View style={styles.orderCard}>
                            <View style={styles.orderTop}>
                                <View>
                                    <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
                                    <Text style={styles.orderCustomer}>{item.userId?.name} • {item.userId?.phone || 'No phone'}</Text>
                                    <Text style={styles.orderTime}>{new Date(item.createdAt).toLocaleString()}</Text>
                                </View>
                                <TouchableOpacity style={[styles.statusBtn, { backgroundColor: `${sc.color}20` }]} onPress={() => updateStatus(item._id, item.status)}>
                                    <Ionicons name={sc.icon} size={14} color={sc.color} />
                                    <Text style={[styles.statusText, { color: sc.color }]}>{item.status}</Text>
                                    <Ionicons name="chevron-down" size={12} color={sc.color} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.divider} />
                            {item.items.map((orderItem, idx) => (
                                <Text key={idx} style={styles.itemLine}>{orderItem.quantity}x {orderItem.name || 'Item'} — Rs.{(orderItem.price * orderItem.quantity).toFixed(0)}</Text>
                            ))}
                            <View style={styles.deliveryRow}>
                                <Text style={styles.deliveryLabel}>Delivery</Text>
                                <Text style={styles.deliveryValue}>
                                    {item.deliveryPersonId?.name || 'Unassigned'}
                                </Text>
                                <TouchableOpacity style={styles.assignBtn} onPress={() => assignDelivery(item._id)}>
                                    <Text style={styles.assignText}>{item.deliveryPersonId ? 'Change' : 'Assign'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.orderBottom}>
                                <Text style={styles.specialNote}>{item.specialInstructions || ''}</Text>
                                <Text style={styles.orderTotal}>Rs. {item.totalAmount.toFixed(0)}</Text>
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.empty}><Ionicons name="receipt-outline" size={50} color={colors.textMuted} /><Text style={styles.emptyText}>No orders</Text></View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
    title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
    count: { fontSize: 14, color: colors.textMuted },
    filterList: { paddingHorizontal: 16, paddingVertical: 10 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder, marginRight: 8 },
    filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    list: { paddingHorizontal: 16, paddingBottom: 100 },
    orderCard: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 16, padding: 14, marginBottom: 10 },
    orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderId: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    orderCustomer: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    orderTime: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
    statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
    divider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: 10 },
    itemLine: { fontSize: 12, color: colors.textSecondary, marginBottom: 3 },
    deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    deliveryLabel: { fontSize: 11, color: colors.textMuted },
    deliveryValue: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, flex: 1 },
    assignBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.primary },
    assignText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
    orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    specialNote: { fontSize: 11, color: colors.textMuted, flex: 1 },
    orderTotal: { fontSize: 16, fontWeight: '800', color: colors.primary },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: colors.textMuted, marginTop: 8 },
});
