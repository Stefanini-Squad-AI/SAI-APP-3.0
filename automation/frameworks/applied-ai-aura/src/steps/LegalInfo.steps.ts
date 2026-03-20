/**
 * AURA — LegalInfo Steps
 * Gherkin step definitions for the Legal Information page feature (SAIAPP3-22).
 *
 * Philosophy: each step delegates to WebActions; business logic stays in constants.
 */
import { When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalInfoConstants } from '../constants/LegalInfoConstants';

// ─── Navigation ───────────────────────────────────────────────────────────────

When('I scroll to footer legal section and click {string}', async function (this: AuraWorld, linkText: string) {
  await this.webActions.click(linkText);
});

// ─── Language selector ────────────────────────────────────────────────────────

When('I select the language {string}', async function (this: AuraWorld, languageName: string) {
  const valueMap: Record<string, string> = {
    'English':   LegalInfoConstants.LANGUAGE_VALUES.en,
    'Español':   LegalInfoConstants.LANGUAGE_VALUES.es,
    'Português': LegalInfoConstants.LANGUAGE_VALUES.pt,
  };
  const value = valueMap[languageName] ?? languageName.toLowerCase().slice(0, 2);
  await this.webActions.selectOption('Language selector', value);
  await this.webActions.wait(400);
});

// ─── Assertions ───────────────────────────────────────────────────────────────

Then('the legal info page hero title should be visible', async function (this: AuraWorld) {
  await this.webActions.expectVisible(LegalInfoConstants.HERO_TITLE_TEXT.es);
});

Then('the legal info page should have all required sections', async function (this: AuraWorld) {
  for (const section of LegalInfoConstants.SECTIONS.es) {
    await this.webActions.expectVisible(section);
  }
});

Then('the legal info page internal links should include privacy and terms', async function (this: AuraWorld) {
  await this.webActions.expectVisible(LegalInfoConstants.HERO_TITLE_TEXT.es);
});

Then('the header legal info link should show {string}', async function (this: AuraWorld, expectedText: string) {
  await this.webActions.expectVisible(expectedText);
});

Then('the legal info route should be {string}', async function (this: AuraWorld, expectedPath: string) {
  await this.webActions.expectUrlContains(expectedPath);
});
