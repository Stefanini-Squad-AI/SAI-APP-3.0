/**
 * AURA — Cucumber Configuration (Cucumber JS v11 profile format)
 * Options must be inside the `default` profile for CLI compatibility.
 */
module.exports = {
  default: {
    // ── Feature files ──────────────────────────────────────────────────────
    paths: ['src/features/**/*.feature'],

    // ── TS module first, then support files ────────────────────────────────
    requireModule: ['ts-node/register'],
    require: [
      'src/cucumber/world/AuraWorld.ts',
      'src/cucumber/hooks/index.ts',
      'src/steps/**/*.ts',
    ],

    // ── Reporters ───────────────────────────────────────────────────────────
    format: [
      'progress',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html',
    ],
    formatOptions: {
      snippetInterface: 'async-await',
    },

    // ── Global options ──────────────────────────────────────────────────────
    parallel: 1,
  },
};
