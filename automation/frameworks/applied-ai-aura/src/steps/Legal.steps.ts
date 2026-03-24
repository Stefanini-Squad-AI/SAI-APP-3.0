/**
 * AURA — Legal Steps
 * Gherkin step definitions specific to the Legal Information page.
 * Common navigation and assertion steps are provided by Common.steps.ts.
 * The "I click the navigation link" step is provided by Home.steps.ts.
 */
import { Given, When } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalConstants } from '../constants/LegalConstants';

Given('I navigate to the legal page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LegalConstants.LEGAL_URL);
});

When('I switch the app language to {string}', async function (this: AuraWorld, langCode: string) {
  const languageNames: Record<string, string> = {
    en: 'English',
    es: 'Español',
    pt: 'Português',
  };
  const langName = languageNames[langCode];
  if (!langName) throw new Error(`Unknown language code: "${langCode}"`);

  const toggleBtn = this.page.locator('button[aria-label="Language"], button[aria-haspopup="true"]').first();
  await toggleBtn.waitFor({ state: 'visible', timeout: 10000 });
  await this.webActions.highlightLocator(toggleBtn, `language toggle`);
  await toggleBtn.click();

  const langBtn = this.page.getByRole('button', { name: langName }).first();
  await langBtn.waitFor({ state: 'visible', timeout: 5000 });
  await this.webActions.highlightLocator(langBtn, `language option "${langName}"`);
  await langBtn.click();
});
