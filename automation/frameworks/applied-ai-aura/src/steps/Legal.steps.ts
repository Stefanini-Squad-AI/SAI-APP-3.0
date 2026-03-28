/**
 * AURA — Legal & Pages Steps
 * Shared step definitions for page navigation, heading assertions,
 * language switching, and footer link clicks.
 *
 * Reuses Privacy.steps.ts patterns for consistency.
 * Uses Playwright getByRole directly for reliable element resolution.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { HomeConstants } from '../constants/HomeConstants';

Given('the browser is on the legal page', async function (this: AuraWorld) {
  const base = HomeConstants.BASE_URL.replace(/\/$/, '');
  await this.webActions.navigateTo(`${base}/legal`);
});

When('I click the navigation link {string}', async function (this: AuraWorld, label: string) {
  const link = this.page.getByRole('link', { name: label }).first();
  await link.waitFor({ state: 'visible', timeout: 10000 });
  await link.click();
});

Then('the content should be visible', async function (this: AuraWorld) {
  const body = this.page.locator('body');
  await body.waitFor({ state: 'visible', timeout: 10000 });
});
