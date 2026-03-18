/**
 * AURA — Legal Info Steps
 * Step definitions for the Legal Information page (/legal-info): navigation, links, i18n.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalInfoConstants } from '../constants/LegalInfoConstants';

// ─── Given ────────────────────────────────────────────────────────────────────

Given('I navigate to the app public home', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LegalInfoConstants.BASE_URL);
});

Given('I navigate to the Legal Information page URL', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LegalInfoConstants.LEGAL_INFO_URL);
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('I click on the Legal Information link in the header', async function (this: AuraWorld) {
  await this.page.locator('header a[href*="legal-info"]').first().click();
  await this.webActions.wait(500);
});

When('I click on the Legal Information link in the footer', async function (this: AuraWorld) {
  await this.page.locator('footer a[href*="legal-info"]').first().click();
  await this.webActions.wait(500);
});

When('I navigate to the Legal Information page URL', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LegalInfoConstants.LEGAL_INFO_URL);
});

When('I click on the contact us link on Legal Information page', async function (this: AuraWorld) {
  await this.page.locator('.rounded-2xl a[href*="contact"]').first().click();
  await this.webActions.wait(500);
});

When('I click on the back to home link on Legal Information page', async function (this: AuraWorld) {
  await this.page.locator('.rounded-2xl a[href="/"]').first().click();
  await this.webActions.wait(500);
});

When('I change the site language to English', async function (this: AuraWorld) {
  await this.page.getByRole('button', { name: /language|idioma/i }).first().click();
  await this.webActions.wait(300);
  await this.page.locator('[role="listbox"] button', { hasText: 'English' }).click();
  await this.webActions.wait(500);
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('the Legal Information page title should be visible', async function (this: AuraWorld) {
  await this.webActions.expectVisible(LegalInfoConstants.PAGE_TITLE_SELECTOR);
});

Then('the page should show the Legal Information title in English', async function (this: AuraWorld) {
  await this.webActions.expectVisible('h1');
  const h1 = this.page.locator('h1').first();
  await h1.waitFor({ state: 'visible', timeout: 10000 });
  const text = await h1.textContent();
  if (!text || !text.includes('Legal Information')) {
    throw new Error(
      `Expected Legal Information page title to contain "Legal Information" but got: ${text ?? 'empty'}`,
    );
  }
});
