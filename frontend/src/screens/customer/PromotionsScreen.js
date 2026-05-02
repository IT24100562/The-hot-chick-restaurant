import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import colors from '../../styles/colors';
import { PremiumCard, PremiumButton } from '../../components';

export default function PromotionsScreen({ navigation }) {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState(null);

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const res = await api.get('/api/promotions');
            setPromotions(res.data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = (code) => {
        setCopiedCode(code);
        Alert.alert('Code Copied', `"${code}" copied to clipboard!`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const isPromotionActive = (promo) => {
        const now = new Date();
        const validFrom = new Date(promo.validFrom);
        const validUntil = new Date(promo.validUntil);
        return now >= validFrom && now <= validUntil;
    };

    const getDaysRemaining = (validUntil) => {
        const now = new Date();
        const end = new Date(validUntil);
        const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    };

    const renderPromoCard = ({ item, index }) => {
        const active = isPromotionActive(item);
        const daysRemaining = getDaysRemaining(item.validUntil);
        const gradients = [
            colors.gradientPrimary,
            ['#F59E0B', '#D97706'],
            ['#EC4899', '#DB2777'],
        ];
        const gradient = gradients[index % 3];

        return (
            <TouchableOpacity activeOpacity={0.8} style={styles.promoContainer}>
                <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promoGradient}>
                    {/* Badge */}
                    {active ? (
                        <View style={styles.activeBadge}>
                            <MaterialIcons name="check-circle" size={16} color="#FFF" />
                            <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                    ) : (
                        <View style={styles.expiredBadge}>
                            <MaterialIcons name="schedule" size={16} color="#FFF" />
                            <Text style={styles.expiredBadgeText}>Expired</Text>
                        </View>
                    )}

                    {/* Discount Banner */}
                    <View style={styles.discountBanner}>
                        <Text style={styles.discountPercent}>{item.discountPercentage}</Text>
                        <Text style={styles.discountLabel}>% OFF</Text>
                    </View>

                    {/* Content */}
                    <View style={styles.promoContent}>
                        <Text style={styles.promoTitle}>{item.title}</Text>
                        {item.description && <Text style={styles.promoDescription}>{item.description}</Text>}

                        {/* Code Box */}
                        <TouchableOpacity
                            onPress={() => handleCopyCode(item.code)}
                            style={[styles.codeContainer, copiedCode === item.code && styles.codeCopied]}
                        >
                            <MaterialIcons name="code" size={14} color="#FFF" />
                            <Text style={styles.codeLabel}>Use Code:</Text>
                            <Text style={styles.codeValue}>{item.code}</Text>
                            <MaterialIcons name={copiedCode === item.code ? 'check' : 'content-copy'} size={14} color="#FFF" />
                        </TouchableOpacity>

                        {/* Validity Info */}
                        <View style={styles.validityRow}>
                            <View style={styles.validityItem}>
                                <MaterialIcons name="calendar-today" size={12} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.validityText}>
                                    {active ? `${daysRemaining} days left` : 'Expired'}
                                </Text>
                            </View>
                            <View style={styles.validityItem}>
                                <MaterialIcons name="access-time" size={12} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.validityText}>
                                    Until {new Date(item.validUntil).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Icon */}
                    <MaterialIcons
                        name="local-offer"
                        size={120}
                        color="rgba(255,255,255,0.08)"
                        style={styles.promoIconOverlay}
                    />
                </LinearGradient>
            </TouchableOpacity>
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
                    <Text style={styles.headerTitle}>Special Offers</Text>
                    <Text style={styles.headerSubtitle}>{promotions.length} active promotions</Text>
                </View>
                <MaterialIcons name="local-offer" size={28} color={colors.primary} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <MaterialIcons name="local-offer" size={50} color={colors.primary} />
                    <Text style={styles.loadingText}>Loading promotions...</Text>
                </View>
            ) : promotions.length > 0 ? (
                <FlatList
                    data={promotions}
                    keyExtractor={(item) => item._id}
                    renderItem={renderPromoCard}
                    contentContainerStyle={styles.list}
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <MaterialIcons name="local-offer-outline" size={60} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>No Active Promotions</Text>
                    <Text style={styles.emptySubtext}>Check back soon for amazing deals!</Text>
                    <PremiumButton
                        title="Explore Menu"
                        variant="primary"
                        onPress={() => navigation.navigate('Menu')}
                        style={styles.exploreButton}
                    />
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
    list: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 32,
    },
    promoContainer: {
        marginBottom: 12,
        borderRadius: 18,
        overflow: 'hidden',
    },
    promoGradient: {
        padding: 20,
        minHeight: 200,
        justifyContent: 'space-between',
        position: 'relative',
    },
    activeBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(255,255,255,0.25)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        zIndex: 5,
    },
    activeBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    expiredBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        zIndex: 5,
    },
    expiredBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    discountBanner: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        marginBottom: 16,
    },
    discountPercent: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        lineHeight: 36,
    },
    discountLabel: {
        fontSize: 10,
        color: '#FFF',
        fontWeight: '700',
    },
    promoContent: {
        marginLeft: 16,
        flex: 1,
        zIndex: 3,
    },
    promoTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 4,
    },
    promoDescription: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 18,
        marginBottom: 12,
    },
    codeContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 12,
    },
    codeCopied: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    codeLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },
    codeValue: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '800',
        flex: 1,
        letterSpacing: 1,
    },
    validityRow: {
        flexDirection: 'row',
        gap: 16,
    },
    validityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    validityText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '600',
    },
    promoIconOverlay: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        zIndex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: colors.textMuted,
        marginTop: 12,
        fontSize: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textMuted,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    exploreButton: {
        marginTop: 24,
        minWidth: 160,
    },
});
