/**
 * AURA — Legal Page Steps
 * Most steps are handled by Privacy.steps and Common.steps.
 * Legal page steps use the shared step definitions for navigation, heading checks, and language switching.
 *
 * Reuses:
 * - Given 'the browser is on the {string} page' (Privacy.steps)
 * - When 'I switch language to {string}' (Privacy.steps)
 * - When 'I click the footer link {string}' (Privacy.steps)
 * - Then 'I should see the heading {string}' (Privacy.steps)
 * - Then 'the URL should contain {string}' (Common.steps)
 * - And visibility/element checks (Common.steps)
 */

export {}; // Legal page uses shared steps from Privacy.steps and Common.steps
