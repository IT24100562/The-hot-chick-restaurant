import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { io } from 'socket.io-client';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { PremiumCard, DashboardCard, EmptyState } from '../../components';
import { API_BASE_URL } from '../../api/axios';

const toDateKey = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export default function AdminDashboard({ navigation }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalFoods: 0,
    totalUsers: 0,
    pendingOrders: 0,
    todayReservations: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const getModuleColumns = (screenWidth) => {
    if (screenWidth < 420) return 2;
    if (screenWidth < 768) return 3;
    return 4;
  };

  const calculateStats = (orders, foodsCount, usersCount, totalRevenue, reservations) => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((order) => order.status === 'pending').length;
    const todayKey = toDateKey(new Date());
    const todayReservations = reservations.filter((reservation) => {
      const dateKey = reservation.dateKey || reservation.date?.slice?.(0, 10);
      return dateKey === todayKey && reservation.status !== 'cancelled';
    }).length;
    const resolvedRevenue =
      typeof totalRevenue === 'number'
        ? totalRevenue
        : orders
            .filter((order) => order.status === 'delivered')
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return {
      totalOrders,
      totalRevenue: Math.round(resolvedRevenue),
      totalFoods: foodsCount,
      totalUsers: usersCount,
      pendingOrders,
      todayReservations,
    };
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setErrorMessage('');
      const [orderRes, foodRes, userRes, reservationRes] = await Promise.allSettled([
        api.get('/api/orders/all'),
        api.get('/api/foods'),
        api.get('/api/users'),
        api.get('/api/reservations'),
      ]);
      const orders = orderRes.status === 'fulfilled' ? (orderRes.value.data.data || []) : [];
      const totalRevenue =
        orderRes.status === 'fulfilled' && typeof orderRes.value.data.totalRevenue === 'number'
          ? orderRes.value.data.totalRevenue
          : null;
      const totalFoods = foodRes.status === 'fulfilled' ? (foodRes.value.data.data || []).length : 0;
      const totalUsers = userRes.status === 'fulfilled' ? (userRes.value.data.data || []).length : 0;
      const reservations = reservationRes.status === 'fulfilled' ? (reservationRes.value.data.data || []) : [];

      setRecentOrders(orders.slice(0, 5));
      setStats(calculateStats(orders, totalFoods, totalUsers, totalRevenue, reservations));

      if (
        orderRes.status === 'rejected' ||
        foodRes.status === 'rejected' ||
        userRes.status === 'rejected' ||
        reservationRes.status === 'rejected'
      ) {
        setErrorMessage('Some dashboard data could not be loaded. Pull to refresh.');
      }
    } catch (error) {
      setErrorMessage(error.userMessage || 'Failed to load dashboard data.');
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();

      const socket = io(API_BASE_URL, { transports: ['websocket'] });
      socket.emit('joinAdmin');

      socket.on('newOrder', () => {
        fetchDashboardData();
      });

      socket.on('adminOrderUpdated', () => {
        fetchDashboardData();
      });

      socket.on('newReservation', () => {
        fetchDashboardData();
      });

      socket.on('reservationUpdated', () => {
        fetchDashboardData();
      });

      return () => {
        socket.disconnect();
      };
    }, [fetchDashboardData])
  );

  const moduleOptions = [
    { id: 'dashboard', title: 'Dashboard', icon: 'dashboard', screen: 'Dashboard' },
    { id: 'foods', title: 'Foods', icon: 'restaurant-menu', screen: 'Foods' },
    { id: 'orders', title: 'Orders', icon: 'receipt-long', screen: 'OrdersMgmt' },
    { id: 'reviews', title: 'Reviews', icon: 'rate-review', screen: 'Reviews' },
    { id: 'users', title: 'Users', icon: 'people', screen: 'ManageUsers' },
    { id: 'reservations', title: 'Reservations', icon: 'event-seat', screen: 'AdminReservations' },
    { id: 'payments', title: 'Payments', icon: 'payments', screen: 'AdminPayments' },
    { id: 'settings', title: 'Settings', icon: 'settings', screen: 'AdminProfile' },
  ];

  const moduleColumns = getModuleColumns(width);
  const moduleGap = 14;
  const moduleHorizontalPadding = 16;
  const moduleCardWidth =
    (width - moduleHorizontalPadding * 2 - moduleGap * (moduleColumns - 1)) / moduleColumns;

  const handleModulePress = (screen) => {
    const tabScreens = ['Dashboard', 'Foods', 'OrdersMgmt', 'Reviews', 'AdminProfile'];
    if (tabScreens.includes(screen)) {
      navigation.navigate('AdminMain', { screen });
      return;
    }
    navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16A34A"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Admin Dashboard</Text>
            <Text style={styles.subGreeting}>Welcome back, {user?.name?.split(' ')[0]}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('AdminProfile')}>
            <MaterialIcons name="account-circle" size={40} color="#16A34A" />
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={18} color="#B91C1C" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Key Metrics - 2x2 Grid */}
        <View style={styles.metricsContainer}>
          <DashboardCard
            icon="shopping-cart"
            title="Total Orders"
            value={stats.totalOrders.toString()}
            color="#16A34A"
            backgroundColor="#DCFCE7"
            trend={`${stats.pendingOrders} pending`}
            trendUp={false}
          />
          <DashboardCard
            icon="trending-up"
            title="Revenue"
            value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
            color="#10B981"
            backgroundColor="#D1FAE5"
          />
        </View>

        <View style={styles.metricsContainer}>
          <DashboardCard
            icon="restaurant"
            title="Food Items"
            value={stats.totalFoods.toString()}
            color="#16A34A"
            backgroundColor="#DCFCE7"
            trend="Active"
          />
          <DashboardCard
            icon="people"
            title="Total Users"
            value={stats.totalUsers.toString()}
            color="#10B981"
            backgroundColor="#D1FAE5"
            trend="+5 this week"
            trendUp={true}
          />
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <PremiumCard variant="light" padding={16}>
            <View style={styles.quickStatRow}>
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <MaterialIcons name="pending-actions" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>{stats.pendingOrders}</Text>
                <Text style={styles.statLabel}>Pending Orders</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <MaterialIcons name="event-seat" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.statValue}>{stats.todayReservations}</Text>
                <Text style={styles.statLabel}>Today's Reservations</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <MaterialIcons name="star" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>4.8</Text>
                <Text style={styles.statLabel}>Avg Rating</Text>
              </View>
            </View>
          </PremiumCard>
        </View>

        {/* Core Modules */}
        <View style={styles.modulesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Core Modules</Text>
            <Text style={styles.sectionCount}>{moduleOptions.length}</Text>
          </View>

          <View style={styles.modulesGrid}>
            {moduleOptions.map((module, index) => (
              <Pressable
                key={module.id}
                onPress={() => handleModulePress(module.screen)}
                style={({ pressed }) => [
                  styles.moduleItem,
                  {
                    width: moduleCardWidth,
                    marginRight: (index + 1) % moduleColumns === 0 ? 0 : moduleGap,
                  },
                  pressed && styles.modulePressed,
                ]}
              >
                <PremiumCard
                  variant="light"
                  marginVertical={0}
                  marginHorizontal={0}
                  padding={16}
                  style={styles.moduleCard}
                >
                  <View style={styles.moduleIcon}>
                    <MaterialIcons name={module.icon} size={28} color="#16A34A" />
                  </View>
                  <Text style={styles.moduleTitle} numberOfLines={2}>
                    {module.title}
                  </Text>
                </PremiumCard>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrdersMgmt')}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <PremiumCard
                key={order._id}
                variant="light"
                marginVertical={6}
                marginHorizontal={16}
              >
                <View style={styles.orderRow}>
                  <View style={styles.orderLeft}>
                    <Text style={styles.orderId} numberOfLines={1}>
                      Order #{order._id?.slice(-6)}
                    </Text>
                    <Text style={styles.orderCustomer} numberOfLines={1}>
                      {order.userId?.name || 'Guest'}
                    </Text>
                    <View style={styles.orderStatus}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              order.status === 'pending'
                                ? '#F59E0B'
                                : order.status === 'preparing'
                                ? '#3B82F6'
                                : order.status === 'delivered'
                                ? '#10B981'
                                : '#EF4444',
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              order.status === 'pending'
                                ? '#F59E0B'
                                : order.status === 'preparing'
                                ? '#3B82F6'
                                : order.status === 'delivered'
                                ? '#10B981'
                                : '#EF4444',
                          },
                        ]}
                      >
                        {order.status?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderAmount}>Rs. {order.totalAmount}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('OrdersMgmt', { orderId: order._id })
                      }
                    >
                      <MaterialIcons
                        name="arrow-forward-ios"
                        size={16}
                        color="#16A34A"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </PremiumCard>
            ))
          ) : (
            <EmptyState
              icon="shopping-cart"
              title="No Orders Yet"
              description="Orders will appear here"
            />
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  subGreeting: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
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
    flex: 1,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  quickStatsContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  quickStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  dividerVertical: {
    width: 1,
    height: 60,
    backgroundColor: '#E2E8F0',
  },
  modulesSection: {
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  moduleItem: {
    marginBottom: 12,
  },
  modulePressed: {
    transform: [{ scale: 0.98 }],
  },
  moduleCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  moduleIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#DCFCE7',
  },
  moduleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  recentSection: {
    paddingVertical: 12,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLeft: {
    flex: 1,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  orderCustomer: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
  },
});
