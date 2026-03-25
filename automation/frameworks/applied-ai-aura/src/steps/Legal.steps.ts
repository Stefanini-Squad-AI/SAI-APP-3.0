/**
 * AURA — Legal Page Steps
 * Step definitions specific to the Legal Information page.
 */
import { Given } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalConstants } from '../constants/LegalConstants';

Given('the browser is on the legal page', async function (this: AuraWorld) {
  const base = LegalConstants.BASE_URL.replace(/\/$/, '');
  await this.webActions.navigateTo(`${base}${LegalConstants.LEGAL_PATH}`);
});
