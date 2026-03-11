/**
 * Step definitions for the Home page feature.
 * Regex alternations handle EN / ES / PT in one binding.
 */
import { Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';

Then(
  /^I should see the section "([^"]*)"$|^debo ver la sección "([^"]*)"$|^devo ver a seção "([^"]*)"$/,
  async function (this: AuraWorld, ...args: (string | undefined)[]) {
    const expected = (args.find(a => a !== undefined) as string).toLowerCase().trim();

    // Collect all heading and section title text from the page
    const headings = await this.page.locator('h1, h2, h3, h4').allTextContents();
    const normalized = headings.map(h => h.toLowerCase().trim());

    const found = normalized.some(t => t.includes(expected) || expected.includes(t));

    if (!found) {
      throw new Error(
        `Section "${expected}" not found. Visible headings: ${normalized.filter(h => h.length > 0).join(' | ') || 'none'}`
      );
    }
  }
);
