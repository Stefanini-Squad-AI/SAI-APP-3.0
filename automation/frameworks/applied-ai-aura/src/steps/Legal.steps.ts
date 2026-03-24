/**
 * AURA — Legal Page Steps
 * Custom step bindings for the Legal information page feature.
 * All steps delegate to Common.steps.ts where applicable.
 */
import { When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalConstants } from '../constants/LegalConstants';

// No additional step definitions needed for Legal page feature.
// All Gherkin scenarios use steps already defined in Common.steps.ts:
// - 'I navigate to the deployed pull request preview' (Preview.steps.ts)
// - 'I navigate to {string}' (Common.steps.ts)
// - 'I click on {string} in the page' / 'I click on {string}' (Common.steps.ts)
// - '{string} should be visible' (Common.steps.ts)
// - 'the URL should contain {string}' (Common.steps.ts)

// Optional: add constants reference for future enhancements
export const legalStepContext = {
  constants: LegalConstants,
};
