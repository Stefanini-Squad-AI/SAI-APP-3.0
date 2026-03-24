import { Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';

Then('the legal hero subtitle should have text {string}', async function (this: AuraWorld, text: string) {
  await this.webActions.expectText('[data-testid="legal-hero-subtitle"]', text);
});

Then('the compliance section title should have text {string}', async function (this: AuraWorld, text: string) {
  await this.webActions.expectText('[data-testid="legal-section-1-title"]', text);
});
