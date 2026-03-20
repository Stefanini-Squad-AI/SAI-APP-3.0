/**
 * AURA — Legal Steps
 * Step definitions for the Legal Information page flow.
 *
 * All common steps (visibility, click, URL assertion) are handled by Common.steps.ts.
 * The Preview.steps.ts provides the "I navigate to the deployed pull request preview" step.
 * Only feature-specific navigation steps are defined here.
 */
import { Given } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalConstants } from '../constants/LegalConstants';

// ─── Given ────────────────────────────────────────────────────────────────────

Given('I am on the legal page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LegalConstants.LEGAL_URL);
});
