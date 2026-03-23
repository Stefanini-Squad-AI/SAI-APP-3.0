/**
 * AURA — Home Steps
 * Gherkin step definitions for the TuCreditoOnline home page.
 *
 * Uses Playwright getByRole directly for reliable link resolution
 * on the SPA (React Router <Link> renders <a> tags).
 */
import { Given, When } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { HomeConstants } from '../constants/HomeConstants';

Given('the browser is open on the TuCreditoOnline home page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(HomeConstants.HOME_URL);
});

When('I click the link {string}', async function (this: AuraWorld, label: string) {
  const link = this.page.getByRole('link', { name: label }).first();
  await link.waitFor({ state: 'visible', timeout: 15000 });
  await this.webActions.highlightLocator(link, `link "${label}"`);
  await link.click();
});

When('I click the navigation link {string}', async function (this: AuraWorld, label: string) {
  const link = this.page.locator('header').getByRole('link', { name: label }).first();
  await link.waitFor({ state: 'visible', timeout: 15000 });
  await this.webActions.highlightLocator(link, `nav link "${label}"`);
  await link.click();
});
