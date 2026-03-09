import { test, expect } from '@playwright/test';
import { registerViaAPI, apiPost, apiGet, uniqueEmail } from './helpers';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api';

test.describe('Fase 2: Pruebas de Seguridad y Permisos', () => {
    let companyId: string;
    let adminToken: string;
    let sellerToken: string;
    let productId: string;
    let variantId: string | null = null;
    const sellerEmail = uniqueEmail('seller');

    test.beforeAll(async () => {
        // Register an Admin account
        const account = await registerViaAPI();
        adminToken = account.token!;
        companyId = account.companyId!;

        // 1. Create a Product to have something to order
        const createProductPayload = {
            name: 'Zapatilla Security',
            sku: `SEC-${Date.now()}`,
            description: 'Test',
            price: 1500,
            hasVariants: true,
            variants: [
                { size: '26', color: 'Negro', stock: 100 }
            ]
        };

        const prodRes = await apiPost('/products', createProductPayload, adminToken);
        expect(prodRes.status).toBe(201);
        productId = prodRes.data.id as string;

        const detailedProdRes = await apiGet(`/products/${productId}`, adminToken);
        variantId = detailedProdRes.data.variants[0].id;

        // 2. Create a Seller user
        const sellerPayload = {
            fullName: 'Vendedor Test',
            email: sellerEmail,
            password: 'Password123!',
            role: 'SELLER'
        };
        const userRes = await apiPost('/users', sellerPayload, adminToken);
        expect(userRes.status).toBe(201);

        // 3. Login as the newly created SELLER to get their token
        const loginRes = await apiPost('/auth/login', { email: sellerEmail, password: 'Password123!' });
        expect(loginRes.status).toBe(200);
        sellerToken = loginRes.data.token as string;
    });

    test('1. Tampering de Precios: El Backend debe ignorar precios falsos en el payload de creación de orden', async ({ request }) => {
        const maliciousPayload = {
            items: [
                {
                    productId,
                    variantId: variantId,
                    quantity: 1,
                    price: 1.00,
                    unitPrice: 1.00,
                    subtotal: 1.00
                }
            ]
        };

        const response = await request.post(`${API_BASE}/orders`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
            data: maliciousPayload
        });

        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.error).toBeDefined();

        if (response.status() === 201) {
            expect(body.total).toBeGreaterThan(1);
        }
    });

    test('2. RBAC Roles: Un SELLER no debe poder actualizar las configuraciones de la empresa', async ({ request }) => {
        const response = await request.put(`${API_BASE}/settings`, {
            headers: { 'Authorization': `Bearer ${sellerToken}` },
            data: { companyName: 'Hacked by Seller' }
        });

        // 403 Forbidden
        expect(response.status()).toBe(403);
        const body = await response.json();
        expect(body.error).toContain('Access denied. Insufficient permissions.');
    });

    test('3. Rutas Duras: Acceder a `/api/orders` sin Token debe devolver 401 Unauthorized', async ({ request }) => {
        const response = await request.get(`${API_BASE}/orders`);

        // 401 Unauthorized
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.error).toBe('Access denied. No token provided.');
    });
});
