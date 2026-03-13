// @ts-check
// Functional tests: Home page (TuCreditoOnline) — SAIAPP3-5
const { test, expect } = require('@playwright/test');

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display TuCreditoOnline branding and hero section', async ({ page }) => {
    await expect(page.getByRole('link', { name: /TuCreditoOnline/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should show main call-to-action links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Apply for Credit|Solicitar crédito/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /View Services|Ver servicios/i })).toBeVisible();
  });

  test('should navigate to calculator from hero CTA', async ({ page }) => {
    await page.getByRole('link', { name: /Apply for Credit|Solicitar crédito/i }).first().click();
    await expect(page).toHaveURL(/\/calculator/);
  });

  test('should navigate to services from hero', async ({ page }) => {
    await page.getByRole('link', { name: /View Services|Ver servicios/i }).first().click();
    await expect(page).toHaveURL(/\/services/);
  });
});
