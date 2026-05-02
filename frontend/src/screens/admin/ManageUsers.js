import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Alert, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import colors from '../../styles/colors';
import { PremiumButton, PremiumCard } from '../../components';

export default function ManageUsers({ navigation }) {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [stats, setStats] = useState({
        totalUsers: 0,
        customers: 0,
        deliveryPersons: 0,
        activeUsers: 0,
        blockedUsers: 0,
    });

    useEffect(() => {
        fetchUsersAndStats();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchQuery, roleFilter]);

    const fetchUsersAndStats = async () => {
        try {
            const [usersRes, statsRes] = await Promise.allSettled([
                api.get('/api/admin/users'),
                api.get('/api/admin/users/stats'),
            ]);

            if (usersRes.status === 'fulfilled') {
                setUsers(usersRes.value.data.data || []);
            }

            if (statsRes.status === 'fulfilled') {
                setStats(statsRes.value.data.data || {});
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUsersAndStats();
        setRefreshing(false);
    };

    const filterUsers = () => {
        let filtered = users;

        if (roleFilter !== 'all') {
            filtered = filtered.filter(u => u.role === roleFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(u =>
                u.name.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query)
            );
        }

        setFilteredUsers(filtered);
    };

    const handleChangeRole = (userId, newRole) => {
        Alert.alert(
            'Change Role',
            `Are you sure you want to change this user's role to ${newRole}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
                            Alert.alert('Success', 'Role updated successfully');
                            await fetchUsersAndStats();
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to update role');
                        }
                    },
                },
            ]
        );
    };

    const handleChangeStatus = (userId, newStatus) => {
        Alert.alert(
            'Change Status',
            `Are you sure you want to ${newStatus} this user?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            await api.put(`/api/admin/users/${userId}/status`, { status: newStatus });
                            Alert.alert('Success', 'Status updated successfully');
                            await fetchUsersAndStats();
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
                        }
                    },
                },
            ]
        );
    };

    const renderUserCard = (user) => {
        const roleColor = user.role === 'admin' ? '#EF4444' : user.role === 'delivery' ? '#F59E0B' : '#16A34A';
        const statusColor = user.status === 'active' ? '#10B981' : user.status === 'inactive' ? '#9CA3AF' : '#EF4444';

        return (
            <PremiumCard key={user._id} variant="light" marginVertical={6} marginHorizontal={16}>
                <View style={styles.userCardContent}>
                    <View style={styles.userHeader}>
                        <View style={styles.userInfo}>
                            <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                            <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                        </View>
                        <View style={styles.badgesRow}>
                            <View style={[styles.badge, { backgroundColor: `${roleColor}20` }]}>
                                <Text style={[styles.badgeText, { color: roleColor }]}>
                                    {user.role.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: `${statusColor}20` }]}>
                                <Text style={[styles.badgeText, { color: statusColor }]}>
                                    {user.status.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.userActions}>
                        {/* Role Selector */}
                        <View style={styles.actionGroup}>
                            <Text style={styles.actionLabel}>Role: {user.role}</Text>
                            <View style={styles.roleSelector}>
                                {['customer', 'delivery', 'admin'].map(role => (
                                    <TouchableOpacity
                                        key={role}
                                        onPress={() => handleChangeRole(user._id, role)}
                                        style={[
                                            styles.roleOption,
                                            user.role === role && styles.roleOptionActive,
                                        ]}
                                    >
                                        <Text style={[
                                            styles.roleOptionText,
                                            user.role === role && styles.roleOptionTextActive,
                                        ]}>
                                            {role.slice(0, 3)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Status Selector */}
                        <View style={styles.actionGroup}>
                            <Text style={styles.actionLabel}>Status: {user.status}</Text>
                            <View style={styles.statusSelector}>
                                {['active', 'inactive', 'blocked'].map(status => (
                                    <TouchableOpacity
                                        key={status}
                                        onPress={() => handleChangeStatus(user._id, status)}
                                        style={[
                                            styles.statusOption,
                                            user.status === status && styles.statusOptionActive,
                                        ]}
                                    >
                                        <Text style={[
                                            styles.statusOptionText,
                                            user.status === status && styles.statusOptionTextActive,
                                        ]}>
                                            {status.slice(0, 3)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Meta Info */}
                        {user.phone && (
                            <View style={styles.metaRow}>
                                <MaterialIcons name="phone" size={12} color="#6B7280" />
                                <Text style={styles.metaText}>{user.phone}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </PremiumCard>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.headerTitle}>User Management</Text>
                    <Text style={styles.headerSubtitle}>{filteredUsers.length} of {users.length}</Text>
                </View>
                <MaterialIcons name="people" size={28} color={colors.primary} />
            </View>

            {/* Stats Cards */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statsContainer}
            >
                <PremiumCard variant="green" marginVertical={0} marginHorizontal={8} padding={12} style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalUsers}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </PremiumCard>
                <PremiumCard variant="light" marginVertical={0} marginHorizontal={8} padding={12} style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.customers}</Text>
                    <Text style={styles.statLabel}>Customers</Text>
                </PremiumCard>
                <PremiumCard variant="light" marginVertical={0} marginHorizontal={8} padding={12} style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.deliveryPersons}</Text>
                    <Text style={styles.statLabel}>Delivery</Text>
                </PremiumCard>
                <PremiumCard variant="light" marginVertical={0} marginHorizontal={8} padding={12} style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.blockedUsers}</Text>
                    <Text style={styles.statLabel}>Blocked</Text>
                </PremiumCard>
            </ScrollView>

            {/* Search & Filters */}
            <View style={styles.filterSection}>
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialIcons name="close" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Role Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
                    {['all', 'customer', 'delivery', 'admin'].map(role => (
                        <TouchableOpacity
                            key={`role-${role}`}
                            onPress={() => setRoleFilter(role)}
                            style={[
                                styles.filterChip,
                                roleFilter === role && styles.filterChipActive,
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText,
                                roleFilter === role && styles.filterChipTextActive,
                            ]}>
                                {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Users List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <MaterialIcons name="people" size={50} color={colors.primary} />
                    <Text style={styles.loadingText}>Loading users...</Text>
                </View>
            ) : filteredUsers.length > 0 ? (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => renderUserCard(item)}
                    contentContainerStyle={styles.usersList}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.centerContainer}>
                    <MaterialIcons name="person-off" size={50} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>No Users Found</Text>
                    <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
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
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2,
        fontWeight: '600',
    },
    statsContainer: {
        paddingHorizontal: 8,
        paddingVertical: 12,
    },
    statCard: {
        minWidth: 90,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.primary,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textMuted,
        marginTop: 4,
    },
    filterSection: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
        gap: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        fontSize: 14,
        color: colors.textPrimary,
    },
    filtersRow: {
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    filterChip: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted,
    },
    filterChipTextActive: {
        color: '#FFF',
    },
    usersList: {
        paddingVertical: 12,
    },
    userCardContent: {
        gap: 10,
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    userEmail: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 4,
    },
    badge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    userActions: {
        gap: 8,
    },
    actionGroup: {
        gap: 4,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    roleSelector: {
        flexDirection: 'row',
        gap: 4,
    },
    roleOption: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: '#FFF',
        alignItems: 'center',
    },
    roleOptionActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    roleOptionText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textMuted,
    },
    roleOptionTextActive: {
        color: '#FFF',
    },
    statusSelector: {
        flexDirection: 'row',
        gap: 4,
    },
    statusOption: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: '#FFF',
        alignItems: 'center',
    },
    statusOptionActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    statusOptionText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textMuted,
    },
    statusOptionTextActive: {
        color: '#FFF',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
    },
    metaText: {
        fontSize: 11,
        color: colors.textMuted,
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
