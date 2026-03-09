import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
    companyId: string;
}

interface JwtPayload {
    id: string;
    email: string;
    role: string;
    companyId: string;
    exp: number;
    iat?: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User, refreshToken?: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        const rt = localStorage.getItem('refresh_token');
        // Fire-and-forget: revoke refresh token on the server
        if (rt) {
            axios.post(`${API_URL}/auth/logout`, { refreshToken: rt }).catch(() => { /* ignore */ });
        }
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('saas_cart_items');
        localStorage.removeItem('saas_cart_id');
        localStorage.removeItem('b2b_lead');
    }, []);

    // Proactive silent refresh: called when access token is about to expire
    const silentRefresh = useCallback(async (): Promise<boolean> => {
        const rt = localStorage.getItem('refresh_token');
        if (!rt) return false;
        try {
            const { data } = await axios.post<{ token: string; refreshToken: string }>(`${API_URL}/auth/refresh`, { refreshToken: rt });
            localStorage.setItem('token', data.token);
            localStorage.setItem('refresh_token', data.refreshToken);
            setToken(data.token);
            const decoded = jwtDecode<JwtPayload>(data.token);
            // Update user from new token payload (role may have changed)
            setUser(prev => prev ? { ...prev, role: decoded.role } : { id: decoded.id, email: decoded.email, role: decoded.role, companyId: decoded.companyId });
            return true;
        } catch {
            return false;
        }
    }, []);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode<JwtPayload>(token);
                if (decoded.exp * 1000 < Date.now()) {
                    // Token already expired — try silent refresh before giving up
                    silentRefresh().then(ok => {
                        if (!ok) logout();
                        setLoading(false);
                    });
                    return;
                }
                // Token valid — restore user
                if (!user) {
                    const savedUser = localStorage.getItem('user_data');
                    if (savedUser) {
                        try {
                            setUser(JSON.parse(savedUser));
                        } catch {
                            setUser({ id: decoded.id, email: decoded.email, role: decoded.role, companyId: decoded.companyId });
                        }
                    } else {
                        setUser({ id: decoded.id, email: decoded.email, role: decoded.role, companyId: decoded.companyId });
                    }
                }
                setLoading(false);

                // Schedule proactive refresh 1 minute before expiry
                const msUntilRefresh = Math.max(0, decoded.exp * 1000 - Date.now() - 60_000);
                const timer = setTimeout(async () => {
                    const ok = await silentRefresh();
                    if (!ok) logout();
                }, msUntilRefresh);
                return () => clearTimeout(timer);
            } catch {
                logout();
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [token, logout, silentRefresh]);

    const login = (newToken: string, userData: User, refreshToken?: string) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user_data', JSON.stringify(userData));
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token && !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
