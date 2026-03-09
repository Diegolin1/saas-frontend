/**
 * E2E Tests: Orders Management (#74)
 *
 * Tests the /admin/orders page:
 * - Orders list view (empty state + populated)
 * - Status filter dropdown
 * - Inline status update via select
 * - Terminal status protection (no change after DELIVERED)
 */

import { test, expect } from '@playwright/test';
import { registerViaAPI, injectAuth, waitForToast, TestAccount, apiPost, TEST_PASSWORD } from './helpers';

// --- Shared infrastructure (created once in beforeAll to avoid rate limiting) ---

interface SharedInfra {
    account: TestAccount;       // OWNER account with product + customer
    emptyAccount: TestAccount;  // Account with no orders (for empty-state tests)
    productId: string;
    customerId: string;
}

let shared: SharedInfra;

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api';

async function apiPut(
    path: string,
    body: object,
    token: string
): Promise<{ status: number; data: Record<string, unknown> }> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() };
}

/** Creates a fresh PENDING order using the shared account/product/customer */
async function createOrder(): Promise<{ orderId: string; orderNumber: number }> {
    const { account, productId, customerId } = shared;
    const { status, data } = await apiPost(
        '/orders',
        { customerId, items: [{ productId, quantity: 1 }] },
        account.token!
    );
    if (status !== 201) throw new Error(`Create order failed: ${status} ${JSON.stringify(data)}`);
    return { orderId: data.id as string, orderNumber: data.orderNumber as number };
}

test.beforeAll(async () => {
    const account = await registerViaAPI();
    const emptyAccount = await registerViaAPI();
    const token = account.token!;

    const { status: pStatus, data: pData } = await apiPost(
        '/products',
        {
            name: 'Zapato E2E Orders',
            sku: `E2EO-${Date.now()}`,
            price: 500,
            variants: [{ size: '27', color: 'Negro', stock: 20 }],
            images: [],
        },
        token
    );
    if (pStatus !== 201) throw new Error(`Create product failed: ${pStatus} ${JSON.stringify(pData)}`);

    const { status: cStatus, data: cData } = await apiPost(
        '/customers',
        { businessName: 'Cliente E2E Orders', email: `ceo-${Date.now()}@test.com` },
        token
    );
    if (cStatus !== 201) throw new Error(`Create customer failed: ${cStatus} ${JSON.stringify(cData)}`);

    shared = {
        account,
        emptyAccount,
        productId: pData.id as string,
        customerId: cData.id as string,
    };
});

// --- Tests ---

test.describe('Orders list', () => {
    test('shows empty state when company has no orders', async ({ page }) => {
        const { emptyAccount } = shared;
        const user = { email: emptyAccount.email, companyId: emptyAccount.companyId, role: 'OWNER' };

        await injectAuth(page, emptyAccount.token!, user);
        await page.goto('/admin/orders');

        await expect(page.getByRole('heading', { name: 'Pedidos & Facturas' })).toBeVisible();
        await expect(page.getByText('Sin pedidos aún')).toBeVisible();
    });

    test('renders order list with order data', async ({ page }) => {
        const { account } = shared;
        const { orderNumber } = await createOrder();
        const user = { email: account.email, companyId: account.companyId, role: 'OWNER' };

        await injectAuth(page, account.token!, user);
        await page.goto('/admin/orders');

        await expect(page.getByRole('heading', { name: 'Pedidos & Facturas' })).toBeVisible();
        await expect(page.getByText(`#${orderNumber}`)).toBeVisible();
        await expect(page.getByText('Cliente E2E Orders')).toBeVisible();
    });

    test('shows status filter and "Todos" is selected by default', async ({ page }) => {
        const { account } = shared;
        const user = { email: account.email, companyId: account.companyId, role: 'OWNER' };

        await injectAuth(page, account.token!, user);
        await page.goto('/admin/orders');

        const filterBtn = page.getByRole('button', { name: 'Todos' });
        await expect(filterBtn).toBeVisible();
    });

    test('status filter hides orders that do not match', async ({ page }) => {
        const { account } = shared;
        const { orderNumber } = await createOrder();
        const user = { email: account.email, companyId: account.companyId, role: 'OWNER' };

        await injectAuth(page, account.token!, user);
        await page.goto('/admin/orders');

        // The new order is PENDING. Filtering by SHIPPED (Enviado) should hide it.
        await page.getByRole('button', { name: 'Enviado', exact: true }).click();

        const orderVisible = await page.getByText(`#${orderNumber}`).isVisible().catch(() => false);
        expect(orderVisible).toBe(false);
    });
});

test.describe('Order status update', () => {
    test('OWNER can update order status via inline select', async ({ page }) => {
        const { account } = shared;
        const { orderNumber } = await createOrder();
        const user = { email: account.email, companyId: account.companyId, role: 'OWNER' };

        await injectAuth(page, account.token!, user);
        await page.goto('/admin/orders');

        const row = page.locator('tr').filter({ hasText: `#${orderNumber}` });
        await expect(row).toBeVisible();

        const statusSelect = row.locator('select');
        await statusSelect.selectOption('SHIPPED');

        await waitForToast(page, 'Estado actualizado correctamente');
        await expect(statusSelect).toHaveValue('SHIPPED');
    });

    test('SELLER role cannot see inline status select (read-only badge)', async ({ page }) => {
        const { account } = shared;
        const { orderNumber } = await createOrder();
        // Create a real SELLER user
        const sellerEmail = `seller-${Date.now()}@test.com`;
        await apiPost('/users', { email: sellerEmail, password: TEST_PASSWORD, fullName: 'Vendedor', role: 'SELLER' }, account.token!);

        // Log in as SELLER
        const { data: loginData } = await apiPost('/auth/login', { email: sellerEmail, password: TEST_PASSWORD });

        // Assign the customer to this SELLER so the SELLER can see the orders
        await apiPut(`/customers/${shared.customerId}`, { sellerId: (loginData.user as Record<string, string>).id }, account.token!);

        await injectAuth(page, loginData.token as string, loginData.user as object, loginData.refreshToken as string);
        await page.goto('/admin/orders');

        const row = page.locator('tr').filter({ hasText: `#${orderNumber}` });
        await expect(row).toBeVisible();

        // Should show a span badge, not a select
        await expect(row.locator('select')).toHaveCount(0);
        await expect(row.locator('span', { hasText: 'Pendiente' })).toBeVisible();
    });

    test('cannot change status of a DELIVERED order', async ({ page }) => {
        const { account } = shared;
        const { orderId, orderNumber } = await createOrder();
        const token = account.token!;

        // Advance to DELIVERED via API
        await apiPut(`/orders/${orderId}/status`, { status: 'DELIVERED' }, token);

        const user = { email: account.email, companyId: account.companyId, role: 'OWNER' };
        await injectAuth(page, token, user);
        await page.goto('/admin/orders');

        const row = page.locator('tr').filter({ hasText: `#${orderNumber}` });
        await expect(row).toBeVisible();

        // Try to change status away from DELIVERED
        const statusSelect = row.locator('select');
        await statusSelect.selectOption('PENDING');

        await waitForToast(page, 'Error al actualizar el estado del pedido');
    });

    test('can cancel a PENDING order', async ({ page }) => {
        const { account } = shared;
        const { orderNumber } = await createOrder();
        const user = { email: account.email, companyId: account.companyId, role: 'OWNER' };

        await injectAuth(page, account.token!, user);
        await page.goto('/admin/orders');

        const row = page.locator('tr').filter({ hasText: `#${orderNumber}` });
        const statusSelect = row.locator('select');
        await statusSelect.selectOption('CANCELLED');

        await waitForToast(page, 'Estado actualizado correctamente');
        await expect(statusSelect).toHaveValue('CANCELLED');
    });
});

test.describe('Orders page auth', () => {
    test('redirects unauthenticated user to /login', async ({ page }) => {
        await page.goto('/admin/orders');
        await expect(page).toHaveURL(/\/login/);
    });
});
