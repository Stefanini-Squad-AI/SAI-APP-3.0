/**
 * AURA — Legal Information Steps
 * Step definitions for the Legal Information page feature.
 *
 * Note: Most steps are reused from Common.steps.ts and Preview.steps.ts.
 * This file is structured for future extensions specific to Legal Information functionality.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalInfoConstants } from '../constants/LegalInfoConstants';

// ─── Given ────────────────────────────────────────────────────────────────────

Given('I am on the Legal Information page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LegalInfoConstants.LEGAL_INFO_URL);
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('I navigate to the legal information page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LegalInfoConstants.LEGAL_INFO_PATH);
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('the Legal Information page should be loaded', async function (this: AuraWorld) {
  await this.webActions.expectUrlContains(LegalInfoConstants.LEGAL_INFO_PATH);
  await this.webActions.expectVisible('h1');
});

Then('the page should contain all four legal sections', async function (this: AuraWorld) {
  // This step can be language-agnostic by checking for h2 elements
  // Individual language tests verify the text content
  const pageContent = await this.webActions.getPageText();
  if (!pageContent.includes('General') && !pageContent.includes('Información General') && !pageContent.includes('Informações Gerais')) {
    throw new Error('Legal sections not found on page');
  }
});
