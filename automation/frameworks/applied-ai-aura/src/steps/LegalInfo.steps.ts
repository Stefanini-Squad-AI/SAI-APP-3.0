/**
 * AURA — Legal information page steps (delegates to WebActions).
 */
import { When } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalInfoConstants } from '../constants/LegalInfoConstants';

When('I open the legal information page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LegalInfoConstants.LEGAL_INFO_URL);
});

When('I set the viewport to mobile size', async function (this: AuraWorld) {
  await this.webActions.setViewport(375, 667);
});
