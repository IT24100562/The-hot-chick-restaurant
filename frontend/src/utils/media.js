import { API_BASE_URL } from '../api/axios';

export const buildFileUrl = (path, cacheKey) => {
    if (!path) return '';

    const normalized = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    if (!cacheKey) return normalized;

    const separator = normalized.includes('?') ? '&' : '?';
    return `${normalized}${separator}v=${encodeURIComponent(cacheKey)}`;
};
