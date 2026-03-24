/**
 * AURA — Privacy & Pages Steps
 * Shared step definitions for page navigation, heading assertions,
 * language switching, and footer link clicks.
 *
 * Uses Playwright getByRole directly for reliable element resolution.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { HomeConstants } from '../constants/HomeConstants';

Given('the browser is on the privacy page', async function (this: AuraWorld) {
  const base = HomeConstants.BASE_URL.replace(/\/$/, '');
  await this.webActions.navigateTo(`${base}/privacy`);
});

Given('the browser is on the {string} page', async function (this: AuraWorld, route: string) {
  const base = HomeConstants.BASE_URL.replace(/\/$/, '');
  const path = route.startsWith('/') ? route : `/${route}`;
  await this.webActions.navigateTo(`${base}${path}`);
});

When('I switch language to {string}', async function (this: AuraWorld, language: string) {
  const trigger = this.page.getByLabel('Language').or(this.page.getByLabel('Idioma'));
  await trigger.first().waitFor({ state: 'visible', timeout: 10000 });
  await trigger.first().click();
  const option = this.page.getByRole('button', { name: language });
  await option.waitFor({ state: 'visible', timeout: 5000 });
  await option.click();
  await this.page.waitForTimeout(500);
});

When('I click the footer link {string}', async function (this: AuraWorld, label: string) {
  const link = this.page.locator('footer').getByRole('link', { name: label }).first();
  await link.waitFor({ state: 'visible', timeout: 10000 });
  await link.click();
});

Then('I should see the heading {string}', async function (this: AuraWorld, text: string) {
  const heading = this.page.getByRole('heading', { name: text }).first();
  await heading.waitFor({ state: 'visible', timeout: 30000 });
});

Then('I should see the section heading {string}', async function (this: AuraWorld, text: string) {
  const heading = this.page.getByRole('heading', { name: text }).first();
  await heading.waitFor({ state: 'visible', timeout: 30000 });
});
