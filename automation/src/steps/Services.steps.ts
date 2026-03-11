/**
 * Step definitions for the Services page feature.
 */
import { When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';

When(
  /^I click on "([^"]*)" in the navigation menu$|^hago clic en "([^"]*)" en el menú de navegación$|^clico em "([^"]*)" no menu de navegação$/,
  async function (this: AuraWorld, ...args: (string | undefined)[]) {
    const linkText = args.find(a => a !== undefined) as string;
    await this.I.on(`nav a:has-text("${linkText}")`).click();
    await this.webActions.waitForVisualLoad();
  }
);

Then(
  /^I should see the title "([^"]*)"$|^debo ver el título "([^"]*)"$|^devo ver o título "([^"]*)"$/,
  async function (this: AuraWorld, ...args: (string | undefined)[]) {
    const expected = (args.find(a => a !== undefined) as string).toLowerCase().trim();

    const headings = await this.page.locator('h1, h2').allTextContents();
    const found = headings.some(h =>
      h.toLowerCase().trim().includes(expected) || expected.includes(h.toLowerCase().trim())
    );

    if (!found) {
      throw new Error(`Title "${expected}" not found. Visible headings: ${headings.join(' | ') || 'none'}`);
    }
  }
);

Then(
  /^I should see at least one credit type card$|^debo ver al menos una tarjeta de tipo de crédito$|^devo ver pelo menos um cartão de tipo de crédito$/,
  async function (this: AuraWorld) {
    await this.webActions.waitForElement('[class*="card"], [class*="service"], article', 5000);
    await this.webActions.expectVisible('[class*="card"], [class*="service"], article');
  }
);
