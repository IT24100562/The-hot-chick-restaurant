import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../styles/colors';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            if (navigation?.navigate) {
                navigation.navigate('Login');
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <LinearGradient colors={colors.gradientPrimary} style={styles.container}>
            <View style={styles.logoContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="restaurant" size={60} color={colors.primary} />
                </View>
                <Text style={styles.title}>The Hot Chick</Text>
                <Text style={styles.subtitle}>Premium Restaurant Experience</Text>
                <View style={styles.decorLine} />
                <Text style={styles.tagline}>Fresh, premium, and built for speed</Text>
            </View>
            <View style={styles.bottomSection}>
                <View style={styles.loadingDots}>
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
                    <View style={[styles.dot, { backgroundColor: colors.gold }]} />
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    logoContainer: { alignItems: 'center' },
    iconCircle: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.16)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.22)',
        marginBottom: 24,
    },
    title: {
        fontSize: 42, fontWeight: '900', color: colors.textPrimary,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16, color: '#FFFFFF', marginTop: 8,
        letterSpacing: 3, textTransform: 'uppercase',
    },
    decorLine: {
        width: 60, height: 3, backgroundColor: colors.primary,
        borderRadius: 2, marginTop: 20, marginBottom: 16,
    },
    tagline: {
        fontSize: 14, color: '#FFFFFF', letterSpacing: 1,
    },
    bottomSection: {
        position: 'absolute', bottom: 60,
    },
    loadingDots: {
        flexDirection: 'row', gap: 8,
    },
    dot: {
        width: 10, height: 10, borderRadius: 5,
    },
});
