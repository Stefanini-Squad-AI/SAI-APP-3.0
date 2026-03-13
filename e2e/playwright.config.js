// @ts-check
// Playwright config for TuCreditoOnline functional web tests (SAIAPP3-5)
const { defineConfig, devices } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  timeout: 30_000,
  expect: { timeout: 10_000 },
});
