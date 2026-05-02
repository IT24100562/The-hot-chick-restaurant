import { StyleSheet, Dimensions } from 'react-native';
import colors from './colors';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
    // Containers
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: 100,
    },

    // Glassmorphic Card
    glassCard: {
        backgroundColor: colors.glassBg,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: 20,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
    },
    glassCardElevated: {
        backgroundColor: colors.glassBg,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: 24,
        padding: 20,
        marginVertical: 10,
        marginHorizontal: 16,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },

    // Typography
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    heading: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    body: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    caption: {
        fontSize: 12,
        color: colors.textMuted,
    },
    price: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.primary,
    },

    // Buttons
    primaryButton: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    outlineButton: {
        borderWidth: 1.5,
        borderColor: colors.primary,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 28,
        alignItems: 'center',
    },
    outlineButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },

    // Input
    input: {
        backgroundColor: colors.glassBg,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
    },

    // Row/Flex
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    // Badges
    badge: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },

    // Section
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 24,
        marginBottom: 16,
    },

    // Misc
    divider: {
        height: 1,
        backgroundColor: colors.glassBorder,
        marginVertical: 16,
    },
    screenWidth: width,
    screenHeight: height,
});

// Premium Design System Exports
export const premiumTheme = {
    colors: {
        primary: '#16A34A',
        primaryDark: '#15803D',
        primaryLight: '#4ADE80',
        white: '#FFFFFF',
        softWhite: '#F8FAFC',
        textDark: '#0F172A',
        textLight: '#475569',
        border: '#E2E8F0',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
    },
    spacing: {
        xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
    },
};

export const premiumStyles = StyleSheet.create({
    // Premium Cards
    cardPremium: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginVertical: 10,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    cardGreen: {
        backgroundColor: '#DCFCE7',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    // Premium Buttons
    btnPrimary: {
        backgroundColor: '#16A34A',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    btnPrimaryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    btnSecondary: {
        backgroundColor: '#DCFCE7',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#16A34A',
    },
    // Layout
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
});
