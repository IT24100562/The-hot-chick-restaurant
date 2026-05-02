import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { io } from 'socket.io-client';
import api, { API_BASE_URL } from '../../api/axios';
import colors from '../../styles/colors';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'cancelled', 'seated', 'completed', 'no-show'];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: colors.pending, icon: 'schedule' },
  confirmed: { label: 'Confirmed', color: colors.confirmed, icon: 'check-circle' },
  cancelled: { label: 'Cancelled', color: colors.cancelled, icon: 'cancel' },
  seated: { label: 'Seated', color: colors.preparing, icon: 'restaurant' },
  completed: { label: 'Completed', color: colors.success, icon: 'done-all' },
  'no-show': { label: 'No Show', color: colors.danger, icon: 'report' },
};

const toDateKey = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatDate = (dateValue) => {
  if (!dateValue) return 'No date';
  return new Date(dateValue).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCreatedAt = (dateValue) => {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchReservations = useCallback(async () => {
    try {
      setErrorMessage('');
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter === 'today') params.date = toDateKey(new Date());
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/api/reservations', { params });
      setReservations(res.data.data || []);
    } catch (e) {
      setErrorMessage(e.userMessage || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, search, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchReservations();

      const socket = io(API_BASE_URL, { transports: ['websocket'] });
      socket.emit('joinAdmin');
      socket.on('newReservation', fetchReservations);
      socket.on('reservationUpdated', fetchReservations);

      return () => socket.disconnect();
    }, [fetchReservations])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReservations();
    setRefreshing(false);
  };

  const counts = useMemo(() => ({
    total: reservations.length,
    pending: reservations.filter((item) => item.status === 'pending').length,
    confirmed: reservations.filter((item) => item.status === 'confirmed').length,
    cancelled: reservations.filter((item) => item.status === 'cancelled').length,
  }), [reservations]);

  const updateStatus = (reservation) => {
    const actions = ['pending', 'confirmed', 'cancelled', 'seated', 'completed', 'no-show']
      .filter((status) => status !== reservation.status);

    Alert.alert(
      'Update Reservation',
      `Change status for ${reservation.guestName || reservation.user?.name || 'guest'}?`,
      [
        ...actions.map((status) => ({
          text: STATUS_CONFIG[status]?.label || status,
          onPress: async () => {
            try {
              await api.put(`/api/reservations/${reservation._id}/status`, { status });
              await fetchReservations();
            } catch (e) {
              Alert.alert('Error', e.userMessage || 'Failed to update reservation');
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderStatusChip = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <View style={[styles.statusChip, { backgroundColor: `${config.color}18` }]}>
        <MaterialIcons name={config.icon} size={14} color={config.color} />
        <Text style={[styles.statusChipText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const renderReservation = ({ item }) => {
    const guestName = item.guestName || item.user?.name || 'Guest';
    const guestPhone = item.guestPhone || item.user?.phone || 'No phone';

    return (
      <View style={styles.reservationCard}>
        <View style={styles.cardTop}>
          <View style={styles.customerBlock}>
            <Text style={styles.reservationId}>#{item._id?.slice(-6).toUpperCase()}</Text>
            <Text style={styles.customerName}>{guestName}</Text>
            <Text style={styles.customerMeta}>{guestPhone}</Text>
          </View>
          <TouchableOpacity onPress={() => updateStatus(item)}>
            {renderStatusChip(item.status)}
          </TouchableOpacity>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <MaterialIcons name="event" size={17} color={colors.textMuted} />
            <Text style={styles.detailText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="access-time" size={17} color={colors.textMuted} />
            <Text style={styles.detailText}>{item.timeSlot}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="groups" size={17} color={colors.textMuted} />
            <Text style={styles.detailText}>{item.partySize} guests</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="event-seat" size={17} color={colors.textMuted} />
            <Text style={styles.detailText}>Table {item.tableNumber || 'Auto'}</Text>
          </View>
        </View>

        {item.occasion ? <Text style={styles.noteText}>Occasion: {item.occasion}</Text> : null}
        {item.specialRequests ? <Text style={styles.noteText}>Notes: {item.specialRequests}</Text> : null}

        <View style={styles.cardFooter}>
          <Text style={styles.createdText}>Created {formatCreatedAt(item.createdAt)}</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => updateStatus(item)}>
            <Text style={styles.actionText}>Update</Text>
            <MaterialIcons name="keyboard-arrow-down" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reservations</Text>
          <Text style={styles.subtitle}>User table bookings synchronized live</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <MaterialIcons name="refresh" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {errorMessage ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{counts.total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{counts.confirmed}</Text>
          <Text style={styles.summaryLabel}>Confirmed</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{counts.pending}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{counts.cancelled}</Text>
          <Text style={styles.summaryLabel}>Cancelled</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, phone, or email"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          onSubmitEditing={fetchReservations}
        />
      </View>

      <View style={styles.filterBand}>
        <FlatList
          horizontal
          data={STATUS_OPTIONS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = statusFilter === item;
            const label = item === 'all' ? 'All' : STATUS_CONFIG[item]?.label || item;
            return (
              <TouchableOpacity
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(item)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          }}
        />
        <View style={styles.dateFilters}>
          {['all', 'today'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.dateChip, dateFilter === item && styles.filterChipActive]}
              onPress={() => setDateFilter(item)}
            >
              <Text style={[styles.filterText, dateFilter === item && styles.filterTextActive]}>
                {item === 'all' ? 'All Dates' : 'Today'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading reservations...</Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item._id}
          renderItem={renderReservation}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialIcons name="event-seat" size={52} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No reservations found</Text>
              <Text style={styles.emptySub}>New user bookings will appear here automatically.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  title: { fontSize: 24, fontWeight: '900', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, color: colors.danger, fontSize: 12, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.glassBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 18, fontWeight: '900', color: colors.primary },
  summaryLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', marginTop: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.backgroundLight,
  },
  searchInput: { flex: 1, minHeight: 44, color: colors.textPrimary, fontSize: 14 },
  filterBand: { paddingTop: 12 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 12,
    borderRadius: 10,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  filterTextActive: { color: '#FFF' },
  dateFilters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textMuted, marginTop: 10, fontSize: 13 },
  list: { padding: 16, paddingBottom: 110 },
  reservationCard: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  customerBlock: { flex: 1 },
  reservationId: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  customerName: { color: colors.textPrimary, fontSize: 16, fontWeight: '900', marginTop: 2 },
  customerMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  statusChipText: { fontSize: 11, fontWeight: '800' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.backgroundElevated,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  detailText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  noteText: { marginTop: 10, color: colors.textMuted, fontSize: 12 },
  cardFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  createdText: { flex: 1, color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  actionText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  emptyBox: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 24 },
  emptyTitle: { color: colors.textSecondary, fontSize: 18, fontWeight: '800', marginTop: 12 },
  emptySub: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 },
});
