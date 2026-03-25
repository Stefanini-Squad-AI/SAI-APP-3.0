/**
 * AURA — POSSimulator Steps
 * Specialized steps for POS Simulator payment flows.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';

When(
  'I click on {string} in the page',
  async function (this: AuraWorld, target: string) {
    await this.webActions.click(target);
  },
);

Then(
  '{string} should be visible',
  async function (this: AuraWorld, target: string) {
    await this.webActions.expectVisible(target);
  },
);

Then(
  '{string} should be hidden',
  async function (this: AuraWorld, target: string) {
    await this.webActions.expectHidden(target);
  },
);
