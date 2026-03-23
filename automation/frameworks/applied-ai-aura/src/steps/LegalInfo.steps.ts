/**
 * AURA — LegalInfo Steps
 * Step definitions for the Información Legal page flow.
 * Each step is a single-line delegation to WebActions or raw Playwright page.
 *
 * Reused from Common.steps.ts (do NOT redefine):
 *   - Given('I navigate to {string}', ...)
 *   - When('I click on {string}', ...)
 *   - Then('{string} should be visible', ...)
 *   - Then('the URL should contain {string}', ...)
 *
 * Reused from Preview.steps.ts (do NOT redefine):
 *   - Given('I navigate to the deployed pull request preview', ...)
 */
import { Given } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalInfoConstants } from '../constants/LegalInfoConstants';

// ─── Given ────────────────────────────────────────────────────────────────────

Given('I navigate to the legal information page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LegalInfoConstants.LEGAL_INFO_URL);
});

Given('the viewport is {int} pixels wide', async function (this: AuraWorld, width: number) {
  await this.page.setViewportSize({ width, height: 667 });
});
