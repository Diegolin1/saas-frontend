/**
 * E2E — Auth flows
 *
 * Tests:
 *  1. Register new company → lands on /admin
 *  2. Login with valid credentials → lands on /admin
 *  3. Login with wrong password shows error
 *  4. Forgot password page renders
 *  5. Protected routes redirect to /login when unauthenticated
 */

import { test, expect } from '@playwright/test';
import { registerViaAPI, registerViaUI, loginViaUI, TEST_PASSWORD, uniqueEmail, uniqueCompany } from './helpers';

// ─── Register ─────────────────────────────────────────────────────────────────

test.describe('Register', () => {
    test('new company → redirects to /admin dashboard', async ({ page }) => {
        await registerViaUI(page);

        await expect(page).toHaveURL(/\/admin/);
        // Sidebar / navigation should be visible
        await expect(page.locator('nav').first()).toBeVisible();
    });

    test('short password shows client-side error', async ({ page }) => {
        await page.goto('/register');

        await page.getByPlaceholder('Ej. Calzado León SA de CV').fill(uniqueCompany());
        await page.getByPlaceholder('Ej. Juan Pérez').fill('Admin Test');
        await page.getByPlaceholder('tu@empresa.com').fill(uniqueEmail());
        await page.getByPlaceholder('Mín. 8 caracteres').fill('abc');
        await page.getByPlaceholder('Repite contraseña').fill('abc');

        // The password input has minLength={8}, so HTML5 validation would silently block
        // the submit without firing the JS handler. Disable native validation so our
        // React error message (role="alert") can appear.
        await page.evaluate(() => {
            const form = document.querySelector('form');
            if (form) form.noValidate = true;
        });

        await page.getByRole('button', { name: 'Crear Cuenta Gratis' }).click();

        // Should stay on register page with error message
        await expect(page).toHaveURL(/\/register/);
        await expect(page.getByRole('alert')).toBeVisible();
        await expect(page.getByRole('alert')).toContainText('8 caracteres');
    });

    test('mismatched passwords shows error', async ({ page }) => {
        await page.goto('/register');

        await page.getByPlaceholder('Ej. Calzado León SA de CV').fill(uniqueCompany());
        await page.getByPlaceholder('Ej. Juan Pérez').fill('Admin Test');
        await page.getByPlaceholder('tu@empresa.com').fill(uniqueEmail());
        await page.getByPlaceholder('Mín. 8 caracteres').fill(TEST_PASSWORD);
        await page.getByPlaceholder('Repite contraseña').fill('DifferentPass1');
        await page.getByRole('button', { name: 'Crear Cuenta Gratis' }).click();

        await expect(page).toHaveURL(/\/register/);
        await expect(page.getByRole('alert')).toContainText('contraseñas');
    });

    test('duplicate email shows server error', async ({ page }) => {
        // First register an account
        const account = await registerViaAPI();

        await page.goto('/register');
        await page.getByPlaceholder('Ej. Calzado León SA de CV').fill(uniqueCompany());
        await page.getByPlaceholder('Ej. Juan Pérez').fill('Admin Test');
        await page.getByPlaceholder('tu@empresa.com').fill(account.email); // duplicate
        await page.getByPlaceholder('Mín. 8 caracteres').fill(TEST_PASSWORD);
        await page.getByPlaceholder('Repite contraseña').fill(TEST_PASSWORD);
        await page.getByRole('button', { name: 'Crear Cuenta Gratis' }).click();

        await expect(page).toHaveURL(/\/register/);
        await expect(page.getByRole('alert')).toBeVisible();
    });
});

// ─── Login ────────────────────────────────────────────────────────────────────

test.describe('Login', () => {
    test('valid credentials → /admin dashboard', async ({ page }) => {
        const account = await registerViaAPI();
        await loginViaUI(page, account);

        await expect(page).toHaveURL(/\/admin/);
        await expect(page.locator('nav').first()).toBeVisible();
    });

    test('wrong password shows error message', async ({ page }) => {
        const account = await registerViaAPI();

        await page.goto('/login');
        await page.getByLabel('Correo electrónico').fill(account.email);
        await page.getByLabel('Contraseña').fill('WrongPass99');
        await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByRole('alert')).toBeVisible();
    });

    test('unknown email shows generic error (no user enumeration)', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Correo electrónico').fill('nobody@example.com');
        await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
        await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByRole('alert')).toBeVisible();
        // Should NOT say "user not found" — just "invalid credentials"
        await expect(page.getByRole('alert')).not.toContainText('no existe');
    });

    test('"¿Olvidaste tu contraseña?" link navigates to forgot-password', async ({ page }) => {
        await page.goto('/login');
        await page.getByRole('link', { name: /Olvidaste/ }).click();
        await expect(page).toHaveURL(/\/forgot-password/);
    });
});

// ─── Forgot Password Page ────────────────────────────────────────────────────

test.describe('Forgot Password', () => {
    test('shows confirmation message after submitting email', async ({ page }) => {
        await page.goto('/forgot-password');

        await page.getByRole('textbox').fill('cualquiera@test.com');
        await page.getByRole('button', { name: /Enviar/ }).click();

        // Should show the success-state heading (only rendered after sent=true)
        await expect(page.getByRole('heading', { name: 'Revisa tu correo' })).toBeVisible({ timeout: 10_000 });
    });
});

// ─── Protected Routes Redirect ───────────────────────────────────────────────

test.describe('Protected routes', () => {
    test('/admin redirects to /login when unauthenticated', async ({ page }) => {
        // Navigate with cleared storage
        await page.context().clearCookies();
        await page.goto('/admin');

        await expect(page).toHaveURL(/\/login/);
    });

    test('/admin/products redirects to /login when unauthenticated', async ({ page }) => {
        await page.context().clearCookies();
        await page.goto('/admin/products');

        await expect(page).toHaveURL(/\/login/);
    });
});
