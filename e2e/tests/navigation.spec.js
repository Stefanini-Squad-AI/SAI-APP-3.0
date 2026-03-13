// @ts-check
// Functional tests: Public navigation (TuCreditoOnline) — SAIAPP3-5
const { test, expect } = require('@playwright/test');

test.describe('Public navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('header has Home, Services, Calculator, About, FAQ, Contact', async ({ page }) => {
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: /^Home$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Services$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Calculator$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /About/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^FAQ$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Contact$/i })).toBeVisible();
  });

  test('navigate to Services page', async ({ page }) => {
    await page.getByRole('link', { name: /^Services$/i }).click();
    await expect(page).toHaveURL(/\/services/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Services|Servicios/i);
  });

  test('navigate to About page', async ({ page }) => {
    await page.getByRole('link', { name: /About/i }).click();
    await expect(page).toHaveURL(/\/about/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/About|Nosotros/i);
  });

  test('navigate to FAQ page', async ({ page }) => {
    await page.getByRole('link', { name: /^FAQ$/i }).click();
    await expect(page).toHaveURL(/\/faq/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/FAQ|Preguntas/i);
  });

  test('navigate to Contact page', async ({ page }) => {
    await page.getByRole('link', { name: /^Contact$/i }).click();
    await expect(page).toHaveURL(/\/contact/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Contact|Contacto/i);
  });

  test('navigate to Calculator from header', async ({ page }) => {
    await page.getByRole('link', { name: /^Calculator$/i }).click();
    await expect(page).toHaveURL(/\/calculator/);
  });

  test('Admin Login link goes to login page', async ({ page }) => {
    await page.getByRole('link', { name: /Admin Login|Panel de administración/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
  });

  test('404 page shows back-to-home link', async ({ page }) => {
    await page.goto('/non-existent-page-404');
    await expect(page.getByText(/not found|no existe/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to Home|Volver/i })).toBeVisible();
  });
});
