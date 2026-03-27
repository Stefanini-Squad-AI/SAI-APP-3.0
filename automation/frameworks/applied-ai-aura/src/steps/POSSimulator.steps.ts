/**
 * AURA — POS Simulator Steps
 * Gherkin step definitions for the POS Simulator feature.
 *
 * Uses semantic targets and delegates directly to WebActions.
 */
import { Given } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { POSSimulatorConstants } from '../constants/POSSimulatorConstants';

Given('the browser is on the pos-simulator page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(POSSimulatorConstants.POS_SIMULATOR_URL);
});

Given('the browser is on the "pos-simulator" page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(POSSimulatorConstants.POS_SIMULATOR_URL);
});
