/**
 * E2E — Product management flows (admin panel)
 *
 * Tests:
 *  1. Product list page renders (authenticated)
 *  2. Create a product → appears in list
 *  3. Validation: cannot submit without name / SKU / price
 *  4. Edit an existing product
 */

import { test, expect, Page } from '@playwright/test';
import { registerViaAPI, injectAuth, TestAccount, apiPost, apiGet, apiDelete } from './helpers';

// ─── Shared account (created once per file to avoid 429 rate limit) ──────────

let sharedAccount: TestAccount;

test.beforeAll(async () => {
    sharedAccount = await registerViaAPI();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function gotoProductsAsAdmin(page: Page) {
    await injectAuth(page, sharedAccount.token!, { id: 'u1', email: sharedAccount.email, role: 'OWNER', companyId: sharedAccount.companyId }, sharedAccount.refreshToken);
    await page.goto('/admin/products');
    await page.waitForURL(/\/admin\/products/);
}

/** Fill in the minimum required fields of the product form and submit */
async function fillProductForm(page: Page, opts: { name: string; sku: string; price: string }) {
    await page.locator('[name="name"]').fill(opts.name);
    await page.locator('[name="sku"]').fill(opts.sku);
    await page.locator('[name="price"]').fill(opts.price);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Product list', () => {
    test('renders product list page for authenticated admin', async ({ page }) => {
        await gotoProductsAsAdmin(page);

        await expect(page.getByRole('heading', { name: 'Catálogo de Productos' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Nuevo Producto' })).toBeVisible();
    });

    test('empty state shows call-to-action text', async ({ page }) => {
        // Delete all products using API first to ensure a completely empty state
        const { data: { products } } = await apiGet('/products?limit=100', sharedAccount.token);
        if (products && products.length > 0) {
            for (const p of products) {
                await apiDelete(`/products/${p.id}`, sharedAccount.token);
            }
        }

        await gotoProductsAsAdmin(page);

        // Fresh company has no products
        await expect(page.getByText('No hay productos aún')).toBeVisible();
    });
});

test.describe('Create product', () => {
    test('navigates to new product form', async ({ page }) => {
        await gotoProductsAsAdmin(page);

        await page.getByRole('link', { name: 'Nuevo Producto' }).click();
        await expect(page).toHaveURL(/\/admin\/products\/new/);
        await expect(page.getByRole('heading', { name: 'Nuevo Producto' })).toBeVisible();
    });

    test('validation: missing name stays on form', async ({ page }) => {
        await gotoProductsAsAdmin(page);
        await page.goto('/admin/products/new');

        // Only fill SKU and price, leave name empty
        await page.locator('[name="sku"]').fill('SKU-TEST-001');
        await page.locator('[name="price"]').fill('299');
        await page.getByRole('button', { name: 'Guardar Producto' }).click();

        // Browser validation OR app validation should prevent navigation
        await expect(page).toHaveURL(/\/admin\/products\/new/);
    });

    test('validation: zero price shows error', async ({ page }) => {
        await gotoProductsAsAdmin(page);
        await page.goto('/admin/products/new');

        await page.locator('[name="name"]').fill('Zapato Test');
        await page.locator('[name="sku"]').fill('SKU-ZERO');
        await page.locator('[name="price"]').fill('0');
        await page.getByRole('button', { name: 'Guardar Producto' }).click();

        // Should show feedback about invalid price
        await expect(page.getByText(/precio.*mayor a 0/i)).toBeVisible({ timeout: 5_000 });
    });

    test('create product successfully → redirects to product list', async ({ page }) => {
        await gotoProductsAsAdmin(page);
        await page.goto('/admin/products/new');

        const productName = `Bota E2E ${Date.now()}`;
        await fillProductForm(page, {
            name: productName,
            sku: `BT-${Date.now()}`,
            price: '499',
        });

        // First variant is pre-filled (size 25, color Negro, stock 10)
        // Just submit as-is

        await page.getByRole('button', { name: 'Guardar Producto' }).click();

        // Success toast should appear
        await expect(page.getByText(/guardado exitosamente/i)).toBeVisible({ timeout: 10_000 });

        // Auto-redirect to product list after 2 seconds
        await page.waitForURL(/\/admin\/products$/, { timeout: 10_000 });

        // The new product should appear in the list
        await expect(page.getByText(productName)).toBeVisible();
    });
});

test.describe('Edit product', () => {
    test('can edit an existing product name', async ({ page }) => {
        // Create product via API using the shared account
        const { data: product } = await apiPost('/products', {
            name: 'Producto Original',
            sku: `ORIG-${Date.now()}`,
            price: 200,
            variants: [{ size: '26', color: 'Café', stock: 5 }],
            images: [],
        }, sharedAccount.token);

        // Inject auth and navigate to edit
        await injectAuth(page, sharedAccount.token!, { id: 'u1', email: sharedAccount.email, role: 'OWNER', companyId: sharedAccount.companyId }, sharedAccount.refreshToken);
        await page.goto(`/admin/products/${product.id}/edit`, { waitUntil: 'domcontentloaded' });

        // Update the name
        const nameInput = page.locator('[name="name"]');
        await expect(nameInput).toHaveValue('Producto Original', { timeout: 10_000 }); // Wait for useEffect to load data
        await nameInput.clear();
        await nameInput.fill('Producto Actualizado');

        await page.getByRole('button', { name: 'Guardar Producto' }).click();

        await expect(page.getByText(/actualizado exitosamente/i)).toBeVisible({ timeout: 10_000 });
    });
});
