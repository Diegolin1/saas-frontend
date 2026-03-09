import { defineConfig, devices } from '@playwright/test';

// Default to production backend when no local server is running.
// Override with E2E_API_URL env var to use a different backend.
const LOCAL_API = 'http://localhost:3000/api';
process.env.E2E_API_URL ??= LOCAL_API;

/**
 * Playwright E2E configuration.
 * Docs: https://playwright.dev/docs/test-configuration
 *
 * Run tests:
 *   npm run test:e2e              # headless, all browsers
 *   npm run test:e2e:headed       # visible browser
 *   npm run test:e2e:ui           # interactive UI mode
 *
 * The tests expect:
 *   - Frontend running at http://localhost:5173 (npm run dev)
 *   - Backend API at http://localhost:3000 (npm run dev in /backend)
 */

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false, // B2B flows often depend on shared state
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [
        ['html', { open: 'never' }],
        ['list'],
    ],

    use: {
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        // Generous timeout: Render free tier cold starts can take 30+ seconds
        actionTimeout: 10_000,
        navigationTimeout: 40_000,
    },

    /* Only test Chromium locally; extend for CI */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        ...(process.env.CI
            ? [
                {
                    name: 'firefox',
                    use: { ...devices['Desktop Firefox'] },
                },
                {
                    name: 'Mobile Safari',
                    use: { ...devices['iPhone 13'] },
                },
            ]
            : []),
    ],

    /* Always start a fresh Vite dev server so VITE_API_URL is applied correctly */
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 60_000,
        // Pass the API URL to Vite so the browser app uses the same backend as helpers.ts
        env: {
            VITE_API_URL: process.env.E2E_API_URL || LOCAL_API,
        },
    },
});
