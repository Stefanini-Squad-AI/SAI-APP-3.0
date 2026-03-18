/**
 * AURA — Legal Information Steps (SAIAPP3-14)
 * Gherkin step definitions for the Legal Information page and navigation.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalInfoConstants } from '../constants/LegalInfoConstants';

// ─── Given ────────────────────────────────────────────────────────────────────

Given('the browser is open on the application home page', async function (this: AuraWorld) {
  const baseUrl = process.env['AURA_TARGET_URL'];
  if (!baseUrl) {
    throw new Error('AURA_TARGET_URL is not defined. Configure the preview URL before running tests.');
  }
  await this.webActions.navigateTo(baseUrl);
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('I click the link to the legal page in the header', async function (this: AuraWorld) {
  const locator = this.page.locator('header a[href*="/legal"]').first();
  await locator.waitFor({ state: 'visible', timeout: 10_000 });
  await locator.click();
  await this.webActions.waitForVisualStabilization(1500);
});

When('I scroll to the footer', async function (this: AuraWorld) {
  await this.webActions.scrollPage('down');
  await this.webActions.wait(500);
  await this.webActions.scrollPage('down');
  await this.webActions.wait(300);
});

When('I click the link to the legal page in the footer', async function (this: AuraWorld) {
  const locator = this.page.locator('footer a[href*="/legal"]').first();
  await locator.waitFor({ state: 'visible', timeout: 10_000 });
  await locator.click();
  await this.webActions.waitForVisualStabilization(1500);
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('the page should display the legal information title', async function (this: AuraWorld) {
  await this.webActions.expectVisible('h1');
  const content = await this.page.textContent('body') ?? '';
  const hasTitle = LegalInfoConstants.PAGE_TITLE_TEXTS.some((t) => content.includes(t));
  if (!hasTitle) {
    throw new Error(
      `[AURA/LegalInfo] Expected page to display one of: ${LegalInfoConstants.PAGE_TITLE_TEXTS.join(', ')}`,
    );
  }
});

Then('the page should display at least three content sections', async function (this: AuraWorld) {
  const count = await this.page.locator('h2').count();
  if (count < LegalInfoConstants.MIN_CONTENT_SECTIONS) {
    throw new Error(
      `[AURA/LegalInfo] Expected at least ${LegalInfoConstants.MIN_CONTENT_SECTIONS} content sections (h2), got ${count}`,
    );
  }
});

Then('the page should display a link to the contact page', async function (this: AuraWorld) {
  const contactLink = this.page.locator('a[href*="/contact"]').first();
  await contactLink.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {
    throw new Error('[AURA/LegalInfo] Expected a visible link to the contact page (/contact)');
  });
});
