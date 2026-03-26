/**
 * AURA — Legal Information Steps
 * Gherkin step definitions for legal information page tests.
 * Uses shared Privacy.steps for page navigation and heading assertions.
 * Defines new steps only for Legal-specific behavior.
 */
import { Given, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';

Then('the navigation should have {string} before {string}', async function (this: AuraWorld, first: string, second: string) {
  const links = this.page.locator('a, button').allTextContents();
  const allText = await links;
  
  const firstIdx = allText.findIndex((text) => text.includes(first));
  const secondIdx = allText.findIndex((text) => text.includes(second));
  
  if (firstIdx === -1) {
    throw new Error(`Link "${first}" not found in navigation`);
  }
  if (secondIdx === -1) {
    throw new Error(`Link "${second}" not found in navigation`);
  }
  
  if (firstIdx >= secondIdx) {
    throw new Error(`Expected "${first}" to appear before "${second}", but found order reversed`);
  }
});
