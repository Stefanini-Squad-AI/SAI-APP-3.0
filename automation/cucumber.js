/**
 * AURA — Cucumber Configuration (Cucumber JS v11)
 * Options live inside the `default` profile for CLI recognition.
 */
module.exports = {
  default: {
    // Feature files (EN by default; override with --paths for ES/PT)
    paths: ['src/features/en/**/*.feature'],

    // TypeScript support, then support files
    requireModule: ['ts-node/register'],
    require: [
      'src/cucumber/world/AuraWorld.ts',
      'src/cucumber/hooks/index.ts',
      'src/steps/**/*.ts',
    ],

    // Reporters
    format: [
      'progress',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html',
    ],
    formatOptions: {
      snippetInterface: 'async-await',
    },

    parallel: 1,
  },

  // Language profiles — run with: cucumber-js --profile es
  es: {
    paths: ['src/features/es/**/*.feature'],
    requireModule: ['ts-node/register'],
    require: [
      'src/cucumber/world/AuraWorld.ts',
      'src/cucumber/hooks/index.ts',
      'src/steps/**/*.ts',
    ],
    format: [
      'progress',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html',
    ],
    formatOptions: { snippetInterface: 'async-await' },
    parallel: 1,
  },

  pt: {
    paths: ['src/features/pt/**/*.feature'],
    requireModule: ['ts-node/register'],
    require: [
      'src/cucumber/world/AuraWorld.ts',
      'src/cucumber/hooks/index.ts',
      'src/steps/**/*.ts',
    ],
    format: [
      'progress',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html',
    ],
    formatOptions: { snippetInterface: 'async-await' },
    parallel: 1,
  },
};
