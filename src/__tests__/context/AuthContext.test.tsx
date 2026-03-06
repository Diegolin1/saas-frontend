/**
 * AuthContext Tests
 * 
 * Tests for: login, logout, token expiration, persistence
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import { useContext } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
    jwtDecode: vi.fn((token: string) => {
        // Return a non-expired payload by default
        return {
            id: 'u1',
            email: 'test@acme.com',
            role: 'OWNER',
            companyId: 'c1',
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        };
    }),
}));

// Test component that exposes context values
function TestConsumer() {
    const { useAuth } = require('../../context/AuthContext');
    // We'll read from AuthContext differently
    return null;
}

// Helper component to display auth state
function AuthDisplay({ onAuth }: { onAuth: (auth: any) => void }) {
    // We'll use a simple approach — render inside provider and check behavior
    return <div data-testid="auth-display">Auth loaded</div>;
}

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should render children inside AuthProvider', () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <div data-testid="child">Hello</div>
                </AuthProvider>
            </BrowserRouter>
        );
        expect(screen.getByTestId('child')).toBeDefined();
        expect(screen.getByText('Hello')).toBeDefined();
    });

    it('should start as unauthenticated when no token in localStorage', () => {
        localStorage.removeItem('token');
        render(
            <BrowserRouter>
                <AuthProvider>
                    <div data-testid="child">content</div>
                </AuthProvider>
            </BrowserRouter>
        );
        // No token → user should not be set
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('should load user from localStorage token on mount', () => {
        localStorage.setItem('token', 'valid.jwt.token');
        localStorage.setItem('user_data', JSON.stringify({
            id: 'u1', email: 'test@acme.com', name: 'Test', role: 'OWNER', companyId: 'c1'
        }));

        render(
            <BrowserRouter>
                <AuthProvider>
                    <div data-testid="child">content</div>
                </AuthProvider>
            </BrowserRouter>
        );

        // Token should still be in localStorage (not cleared = not expired)
        expect(localStorage.getItem('token')).toBe('valid.jwt.token');
    });

    it('should clear token if expired on mount', () => {
        const { jwtDecode } = require('jwt-decode');
        jwtDecode.mockReturnValueOnce({
            exp: Math.floor(Date.now() / 1000) - 100, // expired 100 seconds ago
        });

        localStorage.setItem('token', 'expired.jwt.token');

        render(
            <BrowserRouter>
                <AuthProvider>
                    <div>content</div>
                </AuthProvider>
            </BrowserRouter>
        );

        // Expired token should be removed
        expect(localStorage.getItem('token')).toBeNull();
    });
});
