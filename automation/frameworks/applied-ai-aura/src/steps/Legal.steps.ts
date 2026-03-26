/**
 * AURA — Legal Information Page Steps
 * Step definitions for Legal Information page feature.
 * Uses shared steps from Privacy.steps.ts for page navigation and i18n.
 * All steps delegate to Common.steps.ts or Privacy.steps.ts where available.
 */
import { Given, When } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';

// Navigation to Legal page — delegated to Privacy.steps.ts "the browser is on the {string} page"
// All other step definitions (headings, language switching, URL assertions, navigation)
// are already provided by Privacy.steps.ts and Common.steps.ts

// No new steps required for this feature.
// All scenarios use existing steps from:
//   - Common.steps.ts: navigate, click, URL assertions, headings
//   - Privacy.steps.ts: "the browser is on the {string} page", language switching

