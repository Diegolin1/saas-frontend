import axios, { AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Token refresh helpers ────────────────────────────────────────────────────
let isRefreshing = false;
type QueueEntry = { resolve: (value: string | null) => void; reject: (reason?: unknown) => void };
let failedQueue: QueueEntry[] = [];

function processQueue(error: unknown, token: string | null) {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
}

function clearAuthAndRedirect() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('saas_cart_items');
    localStorage.removeItem('saas_cart_id');
    localStorage.removeItem('b2b_lead');
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
    }
}

// ─── Request interceptor ──────────────────────────────────────────────────────
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

// ─── Response interceptor with refresh token rotation ────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't try to refresh on the refresh/login endpoints themselves
            const url = originalRequest.url || '';
            if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
                clearAuthAndRedirect();
                return Promise.reject(error);
            }

            const storedRefreshToken = localStorage.getItem('refresh_token');
            if (!storedRefreshToken) {
                clearAuthAndRedirect();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Queue this request until refresh completes
                return new Promise<string | null>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(newToken => {
                    if (newToken && originalRequest.headers) {
                        (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
                    }
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await axios.post<{ token: string; refreshToken: string }>(
                    `${API_URL}/auth/refresh`,
                    { refreshToken: storedRefreshToken }
                );
                // Store new tokens
                localStorage.setItem('token', data.token);
                localStorage.setItem('refresh_token', data.refreshToken);

                // Update Authorization header and retry
                if (originalRequest.headers) {
                    (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${data.token}`;
                }
                processQueue(null, data.token);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearAuthAndRedirect();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response?.status === 429) {
            console.warn('Rate limited. Please wait before retrying.');
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
