import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

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
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('saas_cart_items');
        localStorage.removeItem('saas_cart_id');
        localStorage.removeItem('b2b_lead');
        // Don't use window.location.href — let React Router handle navigation
        // The ProtectedRoute will redirect to /login automatically
    }, []);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode<JwtPayload>(token);
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    if (!user) {
                        const savedUser = localStorage.getItem('user_data');
                        if (savedUser) {
                            try {
                                setUser(JSON.parse(savedUser));
                            } catch {
                                setUser({
                                    id: decoded.id,
                                    email: decoded.email,
                                    role: decoded.role,
                                    companyId: decoded.companyId
                                });
                            }
                        } else {
                            setUser({
                                id: decoded.id,
                                email: decoded.email,
                                role: decoded.role,
                                companyId: decoded.companyId
                            });
                        }
                    }

                    // Set up auto-logout when token expires
                    const msUntilExpiry = decoded.exp * 1000 - Date.now();
                    const timer = setTimeout(() => {
                        logout();
                    }, msUntilExpiry);
                    return () => clearTimeout(timer);
                }
            } catch (error) {
                logout();
            }
        }
        setLoading(false);
    }, [token, logout]);

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user_data', JSON.stringify(userData));
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
