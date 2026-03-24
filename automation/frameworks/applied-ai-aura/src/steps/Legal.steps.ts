/**
 * AURA — Legal Steps
 * Gherkin step definitions for the TuCreditoOnline legal page.
 *
 * Reuses Common.steps.ts and Privacy.steps.ts patterns.
 * Adds mobile menu button interaction for legal-specific scenarios.
 */
import { When } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';

When('I click on the mobile menu button', async function (this: AuraWorld) {
  const button = this.page
    .locator('button')
    .filter({ hasText: /☰|menu|hamburger/i })
    .first()
    .or(this.page.locator('header button').last());
  
  await button.waitFor({ state: 'visible', timeout: 10000 });
  await this.webActions.highlightLocator(button, 'mobile menu button');
  await button.click();
  await this.page.waitForTimeout(500);
});
