/**
 * AURA — LegalInformation Steps
 * Step definitions for the Legal Information page flow.
 *
 * All Gherkin steps in LegalInformation.feature are covered by existing
 * reusable definitions:
 *   - "I navigate to the deployed pull request preview" → Preview.steps.ts
 *   - "I click on {string}"                            → Common.steps.ts
 *   - "{string} should be visible"                     → Common.steps.ts
 *   - "the URL should contain {string}"                → Common.steps.ts
 *
 * This file imports the constants module so it is available as a reference
 * for future feature-specific steps if needed. No new step definitions are
 * required for the current scenario set.
 */
import type { } from '../cucumber/world/AuraWorld';
import { LegalInformationConstants as _constants } from '../constants/LegalInformationConstants';

// Re-export constants so test orchestrators can import from a single surface.
export { _constants as LegalInformationConstants };
