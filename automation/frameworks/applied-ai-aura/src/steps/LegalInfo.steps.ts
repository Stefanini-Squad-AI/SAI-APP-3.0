/**
 * AURA — LegalInfo Steps
 * Step definitions for the Legal Information page flow.
 *
 * Reuses all common assertion and action steps from Common.steps.ts and
 * the preview navigation step from Preview.steps.ts.
 * Only new step: path-based navigation to the preview deployment.
 */
import { Given } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalInfoConstants } from '../constants/LegalInfoConstants';

// ─── Given ────────────────────────────────────────────────────────────────────

Given('I navigate to {string} on the preview deployment', async function (this: AuraWorld, path: string) {
  await this.webActions.navigateTo(`${LegalInfoConstants.BASE_URL}${path}`);
});
