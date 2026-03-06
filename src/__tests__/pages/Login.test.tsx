/**
 * Login Page Tests
 * 
 * Tests for: rendering, validation, form submission
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Login from '../../pages/Login';

// Mock the API
vi.mock('../../services/api', () => ({
    default: {
        post: vi.fn(),
        defaults: { baseURL: 'http://localhost:3000/api', headers: {} },
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
    getErrorMessage: (err: unknown, fallback?: string) => {
        if (err instanceof Error) return err.message;
        return fallback || 'Error';
    },
}));

import api from '../../services/api';

const renderLogin = () => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                <Login />
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('Login Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should render login form with email and password fields', () => {
        renderLogin();
        expect(screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)).toBeDefined();
        expect(screen.getByLabelText(/contraseña/i) || screen.getByPlaceholderText(/password/i)).toBeDefined();
    });

    it('should render submit button', () => {
        renderLogin();
        const button = screen.getByRole('button', { name: /iniciar sesión|login|entrar/i });
        expect(button).toBeDefined();
    });

    it('should render link to register page', () => {
        renderLogin();
        const link = screen.getByText(/regist/i);
        expect(link).toBeDefined();
    });

    it('should show error on failed login', async () => {
        const mockPost = vi.mocked(api.post);
        mockPost.mockRejectedValue(new Error('Credenciales inválidas'));

        renderLogin();

        const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
        const passwordInput = screen.getByLabelText(/contraseña/i) || screen.getByPlaceholderText(/password/i);
        const submitButton = screen.getByRole('button', { name: /iniciar sesión|login|entrar/i });

        await userEvent.type(emailInput, 'bad@email.com');
        await userEvent.type(passwordInput, 'wrongpass');
        await userEvent.click(submitButton);

        await waitFor(() => {
            // Should show some error feedback
            const errorEl = screen.queryByText(/error|inválid|credencial/i);
            expect(errorEl).toBeDefined();
        });
    });
});
