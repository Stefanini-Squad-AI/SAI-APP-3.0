/**
 * AURA — Legal Steps
 * Step definitions for the Informaciones Legales feature.
 *
 * Common navigation, click, visibility, and URL steps are already defined in
 * Common.steps.ts and Preview.steps.ts — they are NOT redefined here.
 *
 * Only steps that are unique to the Legal feature flow are declared below.
 */
import { Given } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalConstants } from '../constants/LegalConstants';

// ─── Given ────────────────────────────────────────────────────────────────────

Given('I navigate to the legal page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LegalConstants.LEGAL_URL);
});
