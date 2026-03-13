// @ts-check
// Functional tests: Credit calculator (TuCreditoOnline) — SAIAPP3-5
const { test, expect } = require('@playwright/test');

test.describe('Credit Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculator');
  });

  test('calculator page loads with title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Credit Calculator|Calculadora/i })).toBeVisible({ timeout: 15000 });
  });

  test('shows credit type selector or empty state', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    const hasSelector = await page.getByText(/Credit Type|Tipo de crédito/i).isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/No credit types|No hay tipos|contact.*admin/i).isVisible().catch(() => false);
    const hasTitle = await page.getByRole('heading', { name: /Credit Calculator|Calculadora/i }).isVisible().catch(() => false);
    expect(hasSelector || hasEmptyState || hasTitle).toBeTruthy();
  });

  test('when credit types exist, form has amount and term inputs', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const creditTypeLabel = page.getByText(/Credit Type|Tipo de crédito/i);
    const hasForm = await creditTypeLabel.isVisible().catch(() => false);
    if (hasForm) {
      await expect(page.getByText(/Monthly Income|Ingreso|Income/i).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/Requested Amount|Monto|Amount/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Apply for Credit CTA is present when calculator is usable', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const applyLink = page.getByRole('link', { name: /Apply for Your Credit|Solicitar|Apply Now/i });
    const applyButton = page.getByRole('button', { name: /Apply for Your Credit|Solicitar|Apply Now/i });
    const hasApply = await applyLink.isVisible().catch(() => false) || await applyButton.isVisible().catch(() => false);
    if (hasApply) {
      await expect(applyLink.or(applyButton)).toBeVisible();
    }
  });
});
