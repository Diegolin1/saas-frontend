/**
 * E2E Test Helpers
 *
 * Shared utilities for Playwright tests:
 * - Unique test data generators (avoid conflicts on re-runs)
 * - Auth helpers (register + login programmatically)
 * - API helper for direct backend calls during setup/teardown
 */

import { Page, expect } from '@playwright/test';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api';

// ─── Data Generators ───────────────────────────────────────────

/** Generate a unique email for each test run so re-runs don't fail on "user exists" */
export function uniqueEmail(prefix = 'test'): string {
    return `${prefix}+${Date.now()}@e2e.example.com`;
}

/** Generate a unique company name */
export function uniqueCompany(prefix = 'TestCo'): string {
    return `${prefix} ${Date.now()}`;
}

/** Strong enough password to pass backend validation (8+ chars, 1 uppercase, 1 number) */
export const TEST_PASSWORD = 'TestPass1';

// ─── Auth Helpers ──────────────────────────────────────────────

export interface TestAccount {
    companyName: string;
    email: string;
    password: string;
    token?: string;
    refreshToken?: string;
    companyId?: string;
}

/**
 * Register + Login via UI and return the created account details.
 * Uses the Register page form.
 */
export async function registerViaUI(page: Page, opts?: Partial<TestAccount>): Promise<TestAccount> {
    const account: TestAccount = {
        companyName: opts?.companyName ?? uniqueCompany(),
        email: opts?.email ?? uniqueEmail(),
        password: opts?.password ?? TEST_PASSWORD,
    };

    await page.goto('/register');
    await page.waitForURL('/register');

    await page.getByPlaceholder('Ej. Calzado León SA de CV').fill(account.companyName);
    await page.getByPlaceholder('Ej. Juan Pérez').fill('Admin E2E');
    await page.getByPlaceholder('tu@empresa.com').fill(account.email);
    await page.getByPlaceholder('Mín. 8 caracteres').fill(account.password);
    await page.getByPlaceholder('Repite contraseña').fill(account.password);

    await page.getByRole('button', { name: 'Crear Cuenta Gratis' }).click();
    // Allow up to 40s: Render free tier may need ~30s to wake up from cold start
    await page.waitForURL(/\/admin/, { timeout: 40_000 });

    return account;
}

/**
 * Login via UI and wait for the admin dashboard.
 */
export async function loginViaUI(page: Page, account: TestAccount): Promise<void> {
    await page.goto('/login');
    await page.waitForURL('/login');

    await page.getByLabel('Correo electrónico').fill(account.email);
    await page.getByLabel('Contraseña').fill(account.password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await page.waitForURL('/admin', { timeout: 15_000 });
}

/**
 * Inject auth tokens directly into localStorage (fast — skips UI login).
 * Used to set up authenticated state before tests that don't test auth.
 */
export async function injectAuth(page: Page, token: string, user: object, refreshToken?: string): Promise<void> {
    await page.addInitScript(([t, u, rt]) => {
        localStorage.setItem('token', t as string);
        localStorage.setItem('user', JSON.stringify(u));
        if (rt) localStorage.setItem('refreshToken', rt as string);
    }, [token, user, refreshToken] as [string, object, string | undefined]);
}

// ─── Direct API Helpers ────────────────────────────────────────

/** Call the backend API directly (no browser) — useful for setup and assertions */
export async function apiPost(path: string, body: object, token?: string): Promise<{ status: number; data: Record<string, unknown> }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    const data = await res.json();
    return { status: res.status, data };
}

export async function apiGet(path: string, token?: string): Promise<{ status: number; data: any }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { method: 'GET', headers });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

export async function apiDelete(path: string, token?: string): Promise<{ status: number; data: any }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

/**
 * Register a new account directly via API (faster than UI — use for test setup).
 */
export async function registerViaAPI(opts?: Partial<TestAccount>): Promise<TestAccount> {
    const account: TestAccount = {
        companyName: opts?.companyName ?? uniqueCompany(),
        email: opts?.email ?? uniqueEmail(),
        password: opts?.password ?? TEST_PASSWORD,
    };

    const { status, data } = await apiPost('/auth/register', {
        companyName: account.companyName,
        adminName: 'Test Admin',
        email: account.email,
        password: account.password,
    });

    if (status !== 201) {
        throw new Error(`Register API failed: ${status} — ${JSON.stringify(data)}`);
    }

    account.token = data.token as string;
    account.refreshToken = data.refreshToken as string;
    account.companyId = (data.user as Record<string, string>)?.companyId;

    return account;
}

// ─── Misc UI Helpers ───────────────────────────────────────────

/** Wait for a toast notification containing text (the app's Toast component) */
export async function waitForToast(page: Page, text: string): Promise<void> {
    await expect(page.getByText(text)).toBeVisible({ timeout: 8_000 });
}

/** Assert that we are on the admin dashboard */
export async function expectDashboard(page: Page): Promise<void> {
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('navigation')).toBeVisible();
}
