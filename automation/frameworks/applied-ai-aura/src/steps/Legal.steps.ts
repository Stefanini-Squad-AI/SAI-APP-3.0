/**
 * AURA — Legal Steps
 * Gherkin step definitions for the TuCreditoOnline legal information page.
 *
 * Uses Playwright getByRole directly for reliable link resolution
 * on the SPA (React Router <Link> renders <a> tags).
 */
import { Given, When } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalConstants } from '../constants/LegalConstants';

Given('the browser is on the legal page', async function (this: AuraWorld) {
  const base = LegalConstants.BASE_URL.replace(/\/$/, '');
  await this.webActions.navigateTo(`${base}/legal`);
});
