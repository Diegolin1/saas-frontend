import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach token automatically
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status } = error.response;

            if (status === 401 || status === 403) {
                // Token expired or invalid — clear auth state
                localStorage.removeItem('token');
                localStorage.removeItem('user_data');

                // Only redirect if we're not already on login/register
                const currentPath = window.location.pathname;
                if (currentPath !== '/login' && currentPath !== '/register') {
                    window.location.href = '/login';
                }
            }

            if (status === 429) {
                console.warn('Rate limited. Please wait before retrying.');
            }
        }

        return Promise.reject(error);
    }
);

export default api;

/**
 * Extract a user-friendly error message from an unknown error (typically Axios).
 * Usage: catch (err: unknown) { setError(getErrorMessage(err, 'Fallback')); }
 */
export function getErrorMessage(error: unknown, fallback = 'Ha ocurrido un error.'): string {
    if (axios.isAxiosError(error)) {
        const serverMsg = error.response?.data?.error;
        if (typeof serverMsg === 'string') return serverMsg;
        return error.message || fallback;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
}