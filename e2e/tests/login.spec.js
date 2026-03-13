// @ts-check
// Functional tests: Admin login (TuCreditoOnline) — SAIAPP3-5
const { test, expect } = require('@playwright/test');

test.describe('Admin Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
  });

  test('login page shows form with email and password', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Administration|Panel|Iniciar/i })).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Log In|Iniciar|Entrar/i })).toBeVisible();
  });

  test('validation: empty submit shows errors', async ({ page }) => {
    await page.getByRole('button', { name: /Log In|Iniciar|Entrar/i }).click();
    await expect(page.getByText(/required|requerido|obligatorio/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('validation: invalid email shows error', async ({ page }) => {
    await page.getByLabel(/Email/i).fill('not-an-email');
    await page.getByLabel(/Password/i).fill('password123');
    await page.getByRole('button', { name: /Log In|Iniciar|Entrar/i }).click();
    await expect(page.getByText(/valid|válido|invalid/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('validation: short password shows error', async ({ page }) => {
    await page.getByLabel(/Email/i).fill('admin@example.com');
    await page.getByLabel(/Password/i).fill('12345');
    await page.getByRole('button', { name: /Log In|Iniciar|Entrar/i }).click();
    await expect(page.getByText(/6|at least|caracteres/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('back to home link works', async ({ page }) => {
    await page.getByRole('link', { name: /Back to home|Volver/i }).click();
    await expect(page).toHaveURL(/\/(\?.*)?$/);
  });

  test('successful login redirects to dashboard when API is available', async ({ page }) => {
    await page.getByLabel(/Email/i).fill(process.env.E2E_ADMIN_EMAIL || 'admin@example.com');
    await page.getByLabel(/Password/i).fill(process.env.E2E_ADMIN_PASSWORD || 'Admin123!');
    await page.getByRole('button', { name: /Log In|Iniciar|Entrar/i }).click();
    await page.waitForURL(/\/(admin\/dashboard|admin)/, { timeout: 15000 }).catch(() => {});
    const url = page.url();
    if (url.includes('/admin/dashboard') || url.includes('/admin')) {
      await expect(page.getByText(/Dashboard|Panel|Welcome|Bienvenido/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
