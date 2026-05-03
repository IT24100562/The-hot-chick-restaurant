import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/axios';
import colors from '../../styles/colors';
import { EmptyState, PremiumCard, StatusBadge } from '../../components';
import { buildFileUrl } from '../../utils/media';

const paymentStatusOptions = ['all', 'paid', 'pending', 'processing', 'failed', 'refunded'];
const editableStatuses = ['pending', 'processing', 'paid', 'failed', 'refunded'];
const paymentMethods = ['cash', 'card', 'online', 'bank-transfer'];

const emptyForm = {
  amount: '',
  method: 'cash',
  status: 'pending',
  reference: '',
  userId: '',
  orderId: '',
};

const formatMoney = (amount) => `Rs. ${Number(amount || 0).toFixed(0)}`;
const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'Not set');

const getOrderLabel = (order) => {
  if (!order?._id) return 'No Order';
  const customerName = order.userId?.name || 'Guest';
  return `#${order._id.slice(-6).toUpperCase()} - ${customerName} - ${formatMoney(order.totalAmount)}`;
};

const confirmDelete = (onConfirm) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm('Delete this payment? This cannot be undone.')) {
      onConfirm();
    }
    return;
  }

  Alert.alert('Delete Payment', 'Delete this payment? This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const customerUsers = users.filter((user) => user.role !== 'admin');

  const fetchPayments = useCallback(async () => {
    try {
      setErrorMessage('');
      const res = await api.get('/api/payments/all');
      setPayments(res.data.data || []);
    } catch (error) {
      setErrorMessage(error.userMessage || 'Unable to load payments. Pull to refresh.');
    }
  }, []);

  const fetchAdminContext = useCallback(async () => {
    const [usersRes, ordersRes] = await Promise.allSettled([
      api.get('/api/users'),
      api.get('/api/orders/all'),
    ]);

    if (usersRes.status === 'fulfilled') {
      setUsers(usersRes.value.data.data || []);
    }

    if (ordersRes.status === 'fulfilled') {
      setOrders(ordersRes.value.data.data || []);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchPayments(), fetchAdminContext()]);
  }, [fetchPayments, fetchAdminContext]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingPayment(null);
  };

  const openCreateForm = () => {
    const firstCustomer = customerUsers[0];
    resetForm();
    setForm({ ...emptyForm, userId: firstCustomer?._id || '' });
    setFormVisible(true);
  };

  const openEditForm = (payment) => {
    setEditingPayment(payment);
    setForm({
      amount: String(payment.amount ?? ''),
      method: payment.method || 'cash',
      status: payment.status || 'pending',
      reference: payment.reference || '',
      userId: payment.user?._id || payment.user || '',
      orderId: payment.order?._id || payment.order || '',
    });
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    resetForm();
  };

  const openDetails = (payment) => {
    setSelectedPayment(payment);
    setDetailsVisible(true);
  };

  const selectOrder = (order) => {
    if (!order?._id) {
      setForm((prev) => ({ ...prev, orderId: '', amount: prev.amount }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      orderId: order._id,
      userId: order.userId?._id || order.userId || prev.userId,
      amount: prev.amount || String(order.totalAmount || ''),
    }));
  };

  const validateForm = () => {
    if (!/^\d+(\.\d{1,2})?$/.test(String(form.amount))) {
      return 'Enter a valid amount.';
    }

    if (!form.orderId && !form.userId) {
      return 'Select a customer or linked order.';
    }

    return '';
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Payment Error', validationError);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        amount: form.amount,
        method: form.method,
        status: form.status,
        reference: form.reference,
        userId: form.userId,
        orderId: form.orderId || null,
      };

      if (editingPayment?._id) {
        await api.put(`/api/payments/${editingPayment._id}`, payload);
      } else {
        await api.post('/api/payments', payload);
      }

      await fetchAll();
      closeForm();
    } catch (error) {
      Alert.alert('Payment Error', error.userMessage || error.response?.data?.message || 'Unable to save payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (payment) => {
    confirmDelete(async () => {
      try {
        await api.delete(`/api/payments/${payment._id}`);
        if (selectedPayment?._id === payment._id) {
          setDetailsVisible(false);
          setSelectedPayment(null);
        }
        await fetchPayments();
      } catch (error) {
        Alert.alert('Payment Error', error.userMessage || 'Unable to delete payment.');
      }
    });
  };

  const filteredPayments = filter === 'all'
    ? payments
    : payments.filter((payment) => (payment.status || 'pending') === filter);

  const paidPayments = payments.filter((payment) => payment.status === 'paid');
  const pendingPayments = payments.filter((payment) => ['pending', 'processing'].includes(payment.status));
  const failedPayments = payments.filter((payment) => payment.status === 'failed');
  const paidTotal = paidPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const renderChoice = ({ itemKey, value, label, active, onPress }) => (
    <TouchableOpacity key={itemKey || value} style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={onPress}>
      <Text style={[styles.choiceText, active && styles.choiceTextActive]} numberOfLines={1}>
        {label || value}
      </Text>
    </TouchableOpacity>
  );

  const renderPayment = ({ item }) => (
    <PremiumCard variant="light" padding={16} marginVertical={6} marginHorizontal={16}>
      <TouchableOpacity style={styles.paymentRow} activeOpacity={0.8} onPress={() => openDetails(item)}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentId}>Payment #{item._id?.slice(-6).toUpperCase()}</Text>
          <Text style={styles.paymentCustomer}>{item.user?.name || 'Guest'}</Text>
          <Text style={styles.paymentOrder}>{item.order?._id ? `Order #${item.order._id.slice(-6).toUpperCase()}` : 'Manual payment'}</Text>
          <View style={styles.paymentMetaRow}>
            <StatusBadge status={item.status || 'pending'} size="sm" />
            <View style={styles.methodBadge}>
              <MaterialIcons name="credit-card" size={12} color={colors.primary} />
              <Text style={styles.methodText}>{(item.method || 'cash').toUpperCase()}</Text>
            </View>
          </View>
          {item.receiptUrl ? (
            <Text style={styles.receiptText}>{buildFileUrl(item.receiptUrl, item.updatedAt || item.createdAt || item._id)}</Text>
          ) : null}
        </View>
        <View style={styles.paymentAmountWrap}>
          <Text style={styles.paymentAmount}>{formatMoney(item.amount)}</Text>
          <Text style={styles.paymentDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          <View style={styles.rowActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => openEditForm(item)}>
              <MaterialIcons name="edit" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButtonDanger} onPress={() => handleDelete(item)}>
              <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </PremiumCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>{payments.length} total</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreateForm}>
          <MaterialIcons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {errorMessage ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.summaryRow}>
        <PremiumCard variant="light" padding={14} marginVertical={6} marginHorizontal={8} style={styles.summaryCard}>
          <MaterialIcons name="check-circle" size={22} color={colors.success} />
          <Text style={styles.summaryValue}>{formatMoney(paidTotal)}</Text>
          <Text style={styles.summaryLabel}>Paid Revenue</Text>
        </PremiumCard>
        <PremiumCard variant="light" padding={14} marginVertical={6} marginHorizontal={8} style={styles.summaryCard}>
          <MaterialIcons name="pending-actions" size={22} color={colors.warning} />
          <Text style={styles.summaryValue}>{pendingPayments.length}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </PremiumCard>
        <PremiumCard variant="light" padding={14} marginVertical={6} marginHorizontal={8} style={styles.summaryCard}>
          <MaterialIcons name="cancel" size={22} color={colors.danger} />
          <Text style={styles.summaryValue}>{failedPayments.length}</Text>
          <Text style={styles.summaryLabel}>Failed</Text>
        </PremiumCard>
      </View>

      <FlatList
        data={paymentStatusOptions}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredPayments}
        keyExtractor={(item) => item._id}
        renderItem={renderPayment}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="payments"
            title="No Payments"
            description="Payments will appear here once orders are placed"
          />
        }
      />

      <Modal visible={formVisible} animationType="slide" transparent onRequestClose={closeForm}>
        <View style={styles.modalBackdrop}>
          <View style={styles.formSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingPayment ? 'Edit Payment' : 'Add Payment'}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeForm}>
                <MaterialIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
              <Text style={styles.label}>Linked Order</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
                {renderChoice({
                  value: 'none',
                  label: 'No Order',
                  active: !form.orderId,
                  onPress: () => selectOrder(null),
                })}
                {orders.map((order) => renderChoice({
                  itemKey: order._id,
                  value: order._id,
                  label: getOrderLabel(order),
                  active: form.orderId === order._id,
                  onPress: () => selectOrder(order),
                }))}
              </ScrollView>

              <Text style={styles.label}>Customer</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
                {customerUsers.map((user) => renderChoice({
                  itemKey: user._id,
                  value: user._id,
                  label: user.name || user.email,
                  active: form.userId === user._id,
                  onPress: () => setForm((prev) => ({ ...prev, userId: user._id })),
                }))}
              </ScrollView>

              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={form.amount}
                onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value.replace(/[^0-9.]/g, '') }))}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Method</Text>
              <View style={styles.wrapRow}>
                {paymentMethods.map((method) => renderChoice({
                  itemKey: method,
                  value: method,
                  label: method.toUpperCase(),
                  active: form.method === method,
                  onPress: () => setForm((prev) => ({ ...prev, method })),
                }))}
              </View>

              <Text style={styles.label}>Status</Text>
              <View style={styles.wrapRow}>
                {editableStatuses.map((status) => renderChoice({
                  itemKey: status,
                  value: status,
                  label: status.toUpperCase(),
                  active: form.status === status,
                  onPress: () => setForm((prev) => ({ ...prev, status })),
                }))}
              </View>

              <Text style={styles.label}>Reference</Text>
              <TextInput
                style={styles.input}
                value={form.reference}
                onChangeText={(value) => setForm((prev) => ({ ...prev, reference: value }))}
                placeholder="Receipt, transaction, or note"
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} onPress={handleSubmit} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving...' : editingPayment ? 'Update Payment' : 'Create Payment'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={detailsVisible} animationType="fade" transparent onRequestClose={() => setDetailsVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Details</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setDetailsVisible(false)}>
                <MaterialIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedPayment ? (
              <View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment ID</Text>
                  <Text style={styles.detailValue}>#{selectedPayment._id?.slice(-6).toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer</Text>
                  <Text style={styles.detailValue}>{selectedPayment.user?.name || 'Guest'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{selectedPayment.user?.email || 'Not set'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order</Text>
                  <Text style={styles.detailValue}>{selectedPayment.order?._id ? `#${selectedPayment.order._id.slice(-6).toUpperCase()}` : 'Manual'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>{formatMoney(selectedPayment.amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Method</Text>
                  <Text style={styles.detailValue}>{(selectedPayment.method || 'cash').toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>{(selectedPayment.status || 'pending').toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference</Text>
                  <Text style={styles.detailValue}>{selectedPayment.reference || 'Not set'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedPayment.createdAt)}</Text>
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => {
                    setDetailsVisible(false);
                    openEditForm(selectedPayment);
                  }}>
                    <MaterialIcons name="edit" size={18} color={colors.primary} />
                    <Text style={styles.secondaryText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(selectedPayment)}>
                    <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginTop: 10,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFF',
  },
  list: {
    paddingBottom: 100,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
    paddingRight: 10,
  },
  paymentId: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentCustomer: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  paymentOrder: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  receiptText: {
    fontSize: 10,
    color: colors.primary,
    marginTop: 6,
  },
  paymentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
  },
  methodText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  paymentAmountWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  paymentDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
  },
  iconButtonDanger: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  formSheet: {
    maxHeight: '92%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 16,
  },
  detailSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassBg,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontSize: 14,
  },
  choiceRow: {
    gap: 8,
    paddingRight: 20,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    maxWidth: 260,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  choiceChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  choiceTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginTop: 18,
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  deleteButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
  },
  deleteText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
});
