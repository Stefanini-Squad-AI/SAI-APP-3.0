/**
 * AURA — Legal Information Page Steps
 * Shared step definitions for legal page navigation and header/footer link validation.
 *
 * Reuses steps from Common.steps.ts, Preview.steps.ts, and Privacy.steps.ts.
 * New steps defined here for legal page-specific scenarios.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';

When('I click on {string} in the page', async function (this: AuraWorld, label: string) {
  const button = this.page.getByRole('button', { name: label }).first();
  await button.waitFor({ state: 'visible', timeout: 10000 });
  await button.click();
});

Then('I should see a link to {string} in the header navigation', async function (this: AuraWorld, label: string) {
  const link = this.page.locator('header').getByRole('link', { name: label }).first();
  await link.waitFor({ state: 'visible', timeout: 10000 });
});

Then('I should see a link to {string} in the mobile menu', async function (this: AuraWorld, label: string) {
  const link = this.page.getByRole('link', { name: label }).first();
  await link.waitFor({ state: 'visible', timeout: 10000 });
});
