import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import colors from '../../styles/colors';
import { allowAlphaSpace, allowNumeric, isAlphaSpace, trimSpaces } from '../../utils/validation';

const GUEST_IMAGES = {
    hero: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=80',
    panel: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
};

export default function ProfileScreen({ navigation }) {
    const { user, logout, updateUser, isAdmin } = useAuth();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [errors, setErrors] = useState({ name: '', phone: '', address: '' });

    const validateField = (field, value) => {
        if (field === 'name') {
            if (!value.trim()) return 'Name is required.';
            if (!isAlphaSpace(value)) return 'Name can include only letters and spaces.';
        }

        if (field === 'phone' && value) {
            if (!/^[0-9]{7,15}$/.test(value)) return 'Phone must be numeric (7-15 digits).';
        }

        if (field === 'address') {
            if (!value.trim()) return 'Address is required.';
        }

        return '';
    };

    const handleSave = async () => {
        const nextErrors = {
            name: validateField('name', name),
            phone: validateField('phone', phone),
            address: validateField('address', address),
        };

        setErrors(nextErrors);
        if (Object.values(nextErrors).some((value) => value)) {
            return;
        }
        try {
            const res = await api.put('/api/auth/profile', { name, phone, address });
            if (res.data.success) {
                updateUser({ name, phone, address });
                setEditing(false);
                Alert.alert('Success', 'Profile updated successfully');
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', onPress: logout, style: 'destructive' },
        ]);
    };

    const menuItems = isAdmin ? [
        { icon: 'grid-outline', label: 'Manage Categories', screen: 'ManageCategories' },
        { icon: 'people-outline', label: 'Manage Users', screen: 'ManageUsers' },
        { icon: 'pricetag-outline', label: 'Manage Promotions', screen: 'ManagePromotions' },
    ] : [
        { icon: 'receipt-outline', label: 'My Orders', screen: 'Orders' },
        { icon: 'calendar-outline', label: 'Reservations', screen: 'Reservation' },
        { icon: 'pricetag-outline', label: 'Promotions', screen: 'Promotions' },
    ];

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.guestContainer}>
                    <View style={styles.bgCircleTop} />
                    <View style={styles.bgCircleBottom} />

                    <ImageBackground source={{ uri: GUEST_IMAGES.hero }} style={styles.guestHeroCard} imageStyle={styles.guestHeroImageRadius}>
                        <LinearGradient colors={['rgba(10,10,10,0.2)', 'rgba(30,10,15,0.72)']} style={styles.guestHeroOverlay}>
                            <View style={styles.guestHeroIconWrap}>
                                <Ionicons name="sparkles-outline" size={20} color="#FFFFFF" />
                            </View>
                            <Text style={styles.guestHeroTitle}>Make Every Order Personal</Text>
                            <Text style={styles.guestHeroSubtitle}>Sign in to save favorites, track deliveries, and unlock member-only offers.</Text>
                        </LinearGradient>
                    </ImageBackground>

                    <View style={styles.guestMainCard}>
                        <ImageBackground source={{ uri: GUEST_IMAGES.panel }} style={styles.guestPanelImage} imageStyle={styles.guestPanelRadius}>
                            <LinearGradient colors={['rgba(122,30,44,0.00)', 'rgba(122,30,44,0.45)']} style={styles.guestPanelOverlay}>
                                <Text style={styles.guestPanelText}>The Hot Chick Member Lounge</Text>
                            </LinearGradient>
                        </ImageBackground>

                        <Ionicons name="person-circle-outline" size={84} color={colors.textMuted} />
                        <Text style={styles.guestTitle}>Welcome, Guest</Text>
                        <Text style={styles.guestSubtitle}>Login or create an account to place orders and manage your profile.</Text>

                        <View style={styles.featureRow}>
                            <View style={styles.featureChip}>
                                <Ionicons name="heart-outline" size={14} color={colors.primary} />
                                <Text style={styles.featureText}>Save Favorites</Text>
                            </View>
                            <View style={styles.featureChip}>
                                <Ionicons name="bicycle-outline" size={14} color={colors.primary} />
                                <Text style={styles.featureText}>Track Orders</Text>
                            </View>
                            <View style={styles.featureChip}>
                                <Ionicons name="gift-outline" size={14} color={colors.primary} />
                                <Text style={styles.featureText}>Special Offers</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.authButton} onPress={() => navigation.navigate('Login')}>
                            <LinearGradient colors={colors.gradientPrimary} style={styles.authButtonGradient}>
                                <Text style={styles.authButtonText}>Login</Text>
                                <Ionicons name="arrow-forward" size={16} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.authOutlineButton} onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.authOutlineText}>Create New Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Profile</Text>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <LinearGradient colors={colors.gradientPrimary} style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
                    </LinearGradient>
                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <View style={[styles.roleBadge, isAdmin && styles.adminBadge]}>
                        <Ionicons name={isAdmin ? 'shield-checkmark' : 'person'} size={12} color={isAdmin ? colors.gold : colors.primary} />
                        <Text style={[styles.roleText, isAdmin && { color: colors.gold }]}>{user?.role?.toUpperCase()}</Text>
                    </View>
                </View>

                {/* Edit Profile */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Personal Info</Text>
                        <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)}>
                            <Text style={styles.editText}>{editing ? 'Save' : 'Edit'}</Text>
                        </TouchableOpacity>
                    </View>

                    {[
                        { icon: 'person-outline', label: 'Full Name', value: name, setter: setName },
                        { icon: 'call-outline', label: 'Phone', value: phone, setter: setPhone },
                        { icon: 'location-outline', label: 'Address', value: address, setter: setAddress },
                    ].map((field, index) => (
                        <View key={index} style={styles.infoRow}>
                            <Ionicons name={field.icon} size={20} color={colors.textMuted} />
                            {editing ? (
                                <View style={{ flex: 1 }}>
                                    <TextInput
                                        style={styles.infoInput}
                                        value={field.value}
                                        onChangeText={(value) => {
                                            if (field.label === 'Full Name') {
                                                const normalized = trimSpaces(allowAlphaSpace(value));
                                                field.setter(normalized);
                                                setErrors((prev) => ({ ...prev, name: validateField('name', normalized) }));
                                                return;
                                            }
                                            if (field.label === 'Phone') {
                                                const normalized = allowNumeric(value).slice(0, 15);
                                                field.setter(normalized);
                                                setErrors((prev) => ({ ...prev, phone: validateField('phone', normalized) }));
                                                return;
                                            }
                                            const normalized = trimSpaces(value);
                                            field.setter(normalized);
                                            setErrors((prev) => ({ ...prev, address: validateField('address', normalized) }));
                                        }}
                                        placeholder={field.label}
                                        placeholderTextColor={colors.textMuted}
                                    />
                                    {field.label === 'Full Name' && errors.name ? (
                                        <Text style={styles.errorText}>{errors.name}</Text>
                                    ) : null}
                                    {field.label === 'Phone' && errors.phone ? (
                                        <Text style={styles.errorText}>{errors.phone}</Text>
                                    ) : null}
                                    {field.label === 'Address' && errors.address ? (
                                        <Text style={styles.errorText}>{errors.address}</Text>
                                    ) : null}
                                </View>
                            ) : (
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>{field.label}</Text>
                                    <Text style={styles.infoValue}>{field.value || 'Not set'}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Menu Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.menuItem} onPress={() => navigation.navigate(item.screen)}>
                            <View style={styles.menuIconWrap}>
                                <Ionicons name={item.icon} size={20} color={colors.primary} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 10 },
    title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
    profileCard: {
        alignItems: 'center', backgroundColor: colors.glassBg,
        borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 24,
        padding: 28, marginHorizontal: 16, marginTop: 20,
    },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 32, fontWeight: '800', color: '#FFF' },
    userName: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 14 },
    userEmail: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    roleBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(255,107,53,0.12)', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 5, marginTop: 12,
    },
    adminBadge: { backgroundColor: 'rgba(255,215,0,0.12)' },
    roleText: { fontSize: 11, fontWeight: '700', color: colors.primary },
    section: {
        backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder,
        borderRadius: 20, padding: 18, marginHorizontal: 16, marginTop: 16,
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    editText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 14 },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 11, color: colors.textMuted },
    infoValue: { fontSize: 15, color: colors.textPrimary, fontWeight: '500', marginTop: 2 },
    infoInput: {
        flex: 1, color: colors.textPrimary, fontSize: 15,
        borderBottomWidth: 1, borderBottomColor: colors.glassBorder, paddingVertical: 4,
    },
    errorText: { color: colors.danger, fontSize: 11, marginTop: 6 },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: colors.glassBorder,
    },
    menuIconWrap: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(255,107,53,0.1)',
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    menuLabel: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
    logoutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: 'rgba(255,61,113,0.1)', borderWidth: 1, borderColor: 'rgba(255,61,113,0.2)',
        borderRadius: 16, paddingVertical: 14, marginHorizontal: 16, marginTop: 20,
    },
    logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
    guestContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        position: 'relative',
    },
    bgCircleTop: {
        position: 'absolute',
        top: -60,
        right: -40,
        width: 170,
        height: 170,
        borderRadius: 85,
        backgroundColor: 'rgba(122,30,44,0.08)',
    },
    bgCircleBottom: {
        position: 'absolute',
        bottom: 90,
        left: -60,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(180,90,60,0.09)',
    },
    guestHeroCard: {
        width: '100%',
        height: 180,
        borderRadius: 24,
        marginBottom: 14,
        overflow: 'hidden',
    },
    guestHeroImageRadius: { borderRadius: 24 },
    guestHeroOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    guestHeroIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: 10,
    },
    guestHeroTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
    },
    guestHeroSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 7,
        lineHeight: 18,
    },
    guestMainCard: {
        width: '100%',
        backgroundColor: colors.backgroundLight,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: 24,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 7,
    },
    guestPanelImage: {
        width: '100%',
        height: 98,
        marginBottom: 14,
    },
    guestPanelRadius: {
        borderRadius: 14,
    },
    guestPanelOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingBottom: 8,
    },
    guestPanelText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    guestTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: 12,
    },
    guestSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    featureRow: {
        marginTop: 18,
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    featureChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(122,30,44,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(122,30,44,0.14)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    featureText: {
        fontSize: 11,
        color: colors.primary,
        fontWeight: '700',
    },
    authButton: {
        marginTop: 20,
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
    },
    authButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 13,
    },
    authButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
    },
    authOutlineButton: {
        marginTop: 12,
        width: '100%',
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
    },
    authOutlineText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 15,
    },
});
