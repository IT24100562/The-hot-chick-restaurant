import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/axios';
import colors from '../../styles/colors';
import { PremiumCard, EmptyState, StatusBadge } from '../../components';
import { buildFileUrl } from '../../utils/media';

const paymentStatusOptions = ['all', 'paid', 'pending', 'failed', 'processing'];

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchPayments = useCallback(async () => {
    try {
      setErrorMessage('');
      const res = await api.get('/api/payments/all');
      setPayments(res.data.data || []);
    } catch (error) {
      setErrorMessage(error.userMessage || 'Unable to load payments. Pull to refresh.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [fetchPayments])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const filteredPayments = filter === 'all'
    ? payments
    : payments.filter((payment) => (payment.status || 'pending') === filter);

  const paidPayments = payments.filter((payment) => payment.status === 'paid');
  const pendingPayments = payments.filter((payment) => ['pending', 'processing'].includes(payment.status));
  const failedPayments = payments.filter((payment) => payment.status === 'failed');
  const paidTotal = paidPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const renderPayment = ({ item }) => (
    <PremiumCard variant="light" padding={16} marginVertical={6} marginHorizontal={16}>
      <View style={styles.paymentRow}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentId}>Payment #{item._id?.slice(-6)}</Text>
          <Text style={styles.paymentCustomer}>{item.user?.name || 'Guest'}</Text>
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
          <Text style={styles.paymentAmount}>Rs. {Number(item.amount || 0).toFixed(0)}</Text>
          <Text style={styles.paymentDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
    </PremiumCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
        <Text style={styles.subtitle}>{payments.length} total</Text>
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
          <Text style={styles.summaryValue}>Rs. {paidTotal.toFixed(0)}</Text>
          <Text style={styles.summaryLabel}>Paid Revenue</Text>
        </PremiumCard>
        <PremiumCard variant="light" padding={14} marginVertical={6} marginHorizontal={8} style={styles.summaryCard}>
          <MaterialIcons name="pending-actions" size={22} color={colors.warning} />
          <Text style={styles.summaryValue}>{pendingPayments.length}</Text>
          <Text style={styles.summaryLabel}>Pending Payments</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
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
});
