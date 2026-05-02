import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import colors from '../../styles/colors';
import {
    allowAlphaSpace,
    allowNumeric,
    isAlphaSpace,
    isEmail,
    isPasswordStrong,
    trimSpaces,
} from '../../utils/validation';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=80';

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('customer');
    const [avatarAsset, setAvatarAsset] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    const validateField = (field, value) => {
        if (['name', 'email', 'password', 'confirmPassword'].includes(field) && !value.trim()) {
            return 'This field is required.';
        }

        if (field === 'name' && value.trim() && !isAlphaSpace(value)) {
            return 'Name can include only letters and spaces.';
        }

        if (field === 'email' && value.trim() && !isEmail(value)) {
            return 'Enter a valid email address.';
        }

        if (field === 'phone' && value && !/^[0-9]{7,15}$/.test(value)) {
            return 'Phone must be numeric (7-15 digits).';
        }

        if (field === 'password' && value && !isPasswordStrong(value)) {
            return 'Password must be at least 6 characters.';
        }

        if (field === 'confirmPassword' && value && value !== password) {
            return 'Passwords do not match.';
        }

        return '';
    };

    const pickAvatar = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setAvatarAsset(result.assets[0]);
        }
    };

    const handleRegister = async () => {
        const nextErrors = {
            name: validateField('name', name),
            email: validateField('email', email),
            phone: validateField('phone', phone),
            password: validateField('password', password),
            confirmPassword: validateField('confirmPassword', confirmPassword),
        };

        setErrors(nextErrors);

        if (Object.values(nextErrors).some((value) => value)) {
            return;
        }
        setLoading(true);
        const result = await register(name, email, password, phone, '', role, avatarAsset);
        setLoading(false);
        if (!result.success) {
            Alert.alert('Registration Failed', result.message || 'Unable to create account');
        }
    };

    return (
        <LinearGradient colors={colors.gradientPrimary} style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.heroImage} imageStyle={styles.heroImageRadius}>
                        <LinearGradient colors={['rgba(12,12,12,0.1)', 'rgba(16,16,16,0.68)']} style={styles.heroOverlay}>
                            <View style={styles.badgeRow}>
                                <Text style={styles.heroBadge}>NEW MEMBER</Text>
                            </View>
                            <Text style={styles.heroTitle}>Create Your{`\n`}Food Journey</Text>
                            <Text style={styles.heroSubtitle}>Save favorites, order faster, and unlock member-only offers.</Text>
                        </LinearGradient>
                    </ImageBackground>

                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join The Hot Chick family today!</Text>
                    </View>

                    <View style={styles.formCard}>
                        <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar} disabled={loading}>
                            {avatarAsset?.uri ? (
                                <Image source={{ uri: avatarAsset.uri }} style={styles.avatarPreview} />
                            ) : (
                                <>
                                    <Ionicons name="camera" size={22} color={colors.textMuted} />
                                    <Text style={styles.avatarLabel}>Upload profile photo (optional)</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor={colors.textMuted}
                                value={name}
                                onChangeText={(value) => {
                                    const normalized = trimSpaces(allowAlphaSpace(value));
                                    setName(normalized);
                                    setErrors((prev) => ({ ...prev, name: validateField('name', normalized) }));
                                }}
                                autoCapitalize="words"
                                autoCorrect
                                editable={!loading}
                            />
                        </View>
                        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={(value) => {
                                    const normalized = trimSpaces(value.toLowerCase());
                                    setEmail(normalized);
                                    setErrors((prev) => ({ ...prev, email: validateField('email', normalized) }));
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                        </View>
                        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number (Optional)"
                                placeholderTextColor={colors.textMuted}
                                value={phone}
                                onChangeText={(value) => {
                                    const normalized = allowNumeric(value).slice(0, 15);
                                    setPhone(normalized);
                                    setErrors((prev) => ({ ...prev, phone: validateField('phone', normalized) }));
                                }}
                                keyboardType="phone-pad"
                                editable={!loading}
                            />
                        </View>
                        {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

                        {/* Role Selection */}
                        <View style={styles.roleSection}>
                            <Text style={styles.roleLabel}>Select Your Role</Text>
                            <View style={styles.roleOptions}>
                                <TouchableOpacity
                                    style={[styles.roleOption, role === 'customer' && styles.roleOptionActive]}
                                    onPress={() => setRole('customer')}
                                    disabled={loading}
                                >
                                    <Ionicons
                                        name="person"
                                        size={24}
                                        color={role === 'customer' ? '#FFFFFF' : colors.primary}
                                    />
                                    <Text style={[styles.roleOptionText, role === 'customer' && styles.roleOptionTextActive]}>
                                        Customer
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.roleOption, role === 'delivery' && styles.roleOptionActive]}
                                    onPress={() => setRole('delivery')}
                                    disabled={loading}
                                >
                                    <Ionicons
                                        name="bicycle"
                                        size={24}
                                        color={role === 'delivery' ? '#FFFFFF' : colors.primary}
                                    />
                                    <Text style={[styles.roleOptionText, role === 'delivery' && styles.roleOptionTextActive]}>
                                        Delivery
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={colors.textMuted}
                                value={password}
                                onChangeText={(value) => {
                                    setPassword(value);
                                    setErrors((prev) => ({
                                        ...prev,
                                        password: validateField('password', value),
                                        confirmPassword: validateField('confirmPassword', confirmPassword),
                                    }));
                                }}
                                secureTextEntry={!showPassword}
                                autoCorrect={false}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                placeholderTextColor={colors.textMuted}
                                value={confirmPassword}
                                onChangeText={(value) => {
                                    setConfirmPassword(value);
                                    setErrors((prev) => ({ ...prev, confirmPassword: validateField('confirmPassword', value) }));
                                }}
                                secureTextEntry={!showPassword}
                                autoCorrect={false}
                                editable={!loading}
                            />
                        </View>
                        {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

                        <TouchableOpacity style={[styles.registerBtn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
                            <LinearGradient colors={colors.gradientPrimary} style={styles.buttonGradient}>
                                <Text style={styles.registerBtnText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
                                {!loading && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.loginText}>
                                Already have an account? <Text style={styles.loginHighlight}>Sign In</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    heroImage: { height: 210, borderRadius: 26, overflow: 'hidden', marginBottom: 18 },
    heroImageRadius: { borderRadius: 26 },
    heroOverlay: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 18, paddingBottom: 18 },
    badgeRow: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10 },
    heroBadge: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    heroTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', lineHeight: 29 },
    heroSubtitle: { color: 'rgba(255,255,255,0.9)', marginTop: 8, fontSize: 13, lineHeight: 18 },
    header: { marginBottom: 18 },
    backButton: { marginBottom: 12, alignSelf: 'flex-start' },
    title: { fontSize: 34, fontWeight: '900', color: '#FFFFFF' },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    formCard: {
        backgroundColor: '#FFFFFF', borderWidth: 1,
        borderColor: '#DCFCE7', borderRadius: 28, padding: 24,
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 22,
        elevation: 8,
    },
    avatarPicker: {
        height: 120,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        overflow: 'hidden',
        backgroundColor: '#F0FDF4',
    },
    avatarPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    avatarLabel: { color: colors.textMuted, fontSize: 12, marginTop: 6, fontWeight: '600' },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF', borderWidth: 1,
        borderColor: '#DCFCE7', borderRadius: 14,
        paddingHorizontal: 16, marginBottom: 14, height: 54,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, color: colors.textPrimary, fontSize: 15 },
    errorText: { color: colors.danger, fontSize: 11, fontWeight: '600', marginTop: -8, marginBottom: 10 },
    roleSection: { marginVertical: 16, paddingBottom: 8 },
    roleLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
    roleOptions: { flexDirection: 'row', gap: 12 },
    roleOption: {
        flex: 1, paddingVertical: 16, paddingHorizontal: 12, borderRadius: 14,
        borderWidth: 2, borderColor: colors.glassBorder, backgroundColor: '#FFF',
        alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    roleOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    roleOptionText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
    roleOptionTextActive: { color: '#FFFFFF' },
    registerBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
    buttonGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, gap: 8,
    },
    registerBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    loginLink: { alignItems: 'center', marginTop: 20 },
    loginText: { color: colors.textSecondary, fontSize: 14 },
    loginHighlight: { color: colors.primary, fontWeight: '700' },
});
