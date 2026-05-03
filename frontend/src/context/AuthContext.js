import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');
            if (storedToken && storedUser) {
                try {
                    const res = await api.get('/api/auth/profile');
                    setToken(storedToken);
                    setUser(res.data.data || JSON.parse(storedUser));
                } catch (_) {
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                }
            }
        } catch (error) {
            console.error('Error loading auth:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const res = await api.post('/api/auth/login', { email, password });
            if (res.data.success) {
                const { token: newToken, ...userData } = res.data.data;
                await AsyncStorage.setItem('token', newToken);
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                setToken(newToken);
                setUser(userData);
                return { success: true };
            }
        } catch (error) {
            const isNetworkError = !error.response;
            return {
                success: false,
                message: isNetworkError
                    ? 'Cannot connect to server. Make sure backend is running and your phone and computer are on the same network.'
                    : error.response?.data?.message || 'Login failed',
            };
        }
    };

    const register = async (name, email, password, phone, address, role = 'customer', avatarAsset = null) => {
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('phone', phone || '');
            formData.append('address', address || '');
            formData.append('role', role || 'customer');

            if (avatarAsset?.uri) {
                const fileName = avatarAsset.uri.split('/').pop() || `avatar-${Date.now()}.jpg`;
                const ext = fileName.split('.').pop() || 'jpg';
                formData.append('avatar', {
                    uri: avatarAsset.uri,
                    name: fileName,
                    type: `image/${ext}`,
                });
            }

            const res = await api.post('/api/auth/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.success) {
                const { token: newToken, ...userData } = res.data.data;
                await AsyncStorage.setItem('token', newToken);
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                setToken(newToken);
                setUser(userData);
                return { success: true };
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed',
            };
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (updatedData) => {
        setUser((prev) => {
            const { token: _ignoredToken, ...safeData } = updatedData || {};
            const nextUser = { ...prev, ...safeData };
            AsyncStorage.setItem('user', JSON.stringify(nextUser));
            return nextUser;
        });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                register,
                logout,
                updateUser,
                isAdmin: user?.role === 'admin',
                isDelivery: user?.role === 'delivery',
                isCustomer: user?.role === 'customer',
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
