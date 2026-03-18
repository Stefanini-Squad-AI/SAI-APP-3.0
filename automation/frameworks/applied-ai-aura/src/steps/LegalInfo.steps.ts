/**
 * AURA — Legal Information Steps
 * Step definitions for Legal Information page (SAIAPP3-15, AC1–AC4).
 */
import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalInfoConstants } from '../constants/LegalInfoConstants';

// ─── Given ────────────────────────────────────────────────────────────────────

Given('I navigate to the legal information page directly', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LegalInfoConstants.LEGAL_URL);
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('I click the link to the legal information page', async function (this: AuraWorld) {
  const locator = this.page.locator('a[href*="/legal"]').first();
  await locator.waitFor({ state: 'visible', timeout: 15000 });
  await locator.click();
});

When('I click the {string} link in the footer that goes to the legal page', async function (this: AuraWorld, _sectionLabel: string) {
  const footer = this.page.locator('footer');
  const legalLink = footer.locator('a[href*="/legal"]').first();
  await legalLink.waitFor({ state: 'visible', timeout: 15000 });
  await legalLink.click();
});

When('I navigate to the legal information page directly', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LegalInfoConstants.LEGAL_URL);
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('the URL should contain {string}', async function (this: AuraWorld, path: string) {
  await this.webActions.expectUrlContains(path);
});

Then('the legal page title should be visible', async function (this: AuraWorld) {
  await this.webActions.expectVisible('h1');
});

Then('a link to the contact page should be visible', async function (this: AuraWorld) {
  const link = this.page.locator('a[href*="/contact"]').first();
  await link.waitFor({ state: 'visible', timeout: 10000 });
});

Then('a link to the home page should be visible', async function (this: AuraWorld) {
  const link = this.page.locator('a[href="/"], a[href$="/"]').first();
  await link.waitFor({ state: 'visible', timeout: 10000 });
});
