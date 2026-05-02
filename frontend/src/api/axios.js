import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extractHost = (value) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    // Handles values like "172.20.10.2:8081" or "exp://172.20.10.2:8081".
    const cleaned = value.replace(/^[a-zA-Z]+:\/\//, '');
    const host = cleaned.split('/')[0].split(':')[0];
    return host || null;
};

const getApiBaseUrl = () => {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl) {
        return envUrl;
    }

    const hostUri =
        Constants.expoConfig?.hostUri ||
        Constants.expoConfig?.extra?.expoGo?.debuggerHost ||
        Constants.manifest2?.extra?.expoClient?.hostUri ||
        Constants.manifest?.debuggerHost;

    const hostCandidates = [
        hostUri,
        Constants.linkingUri,
        Constants.experienceUrl,
    ];

    // In Expo Go, localhost points to the device, not the host machine.
    for (const candidate of hostCandidates) {
        const host = extractHost(candidate);
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
            return `http://${host}:5001`;
        }
    }

    // Android emulator can access host machine via 10.0.2.2.
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5001';
    }

    return 'http://localhost:5001';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15001,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
        }

        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;

        error.userMessage =
            serverMessage ||
            (status === 500
                ? 'Something went wrong on the server. Please try again.'
                : status === 404
                    ? 'The requested resource was not found.'
                    : status === 403
                        ? 'You do not have permission to perform this action.'
                        : status === 400
                            ? 'Please check your input and try again.'
                            : 'Network request failed. Please try again.');
        return Promise.reject(error);
    }
);

export { API_BASE_URL };
export default api;
