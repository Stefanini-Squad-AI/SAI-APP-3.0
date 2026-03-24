/**
 * AURA — LegalTest
 * Orchestrator for the Legal page flow.
 *
 * Direct execution:
 *   npx ts-node src/tests/LegalTest.ts
 *   npx ts-node src/tests/LegalTest.ts --tag @smoke
 */
import * as path from 'node:path';
import { config as dotenvConfig } from 'dotenv';
import { runAuraCucumberAndReport, normalizeFeaturePaths } from './auraRunner';

const rootEnv = path.resolve(__dirname, '..', '..', '..', '..', '..', '.env');
dotenvConfig({ path: rootEnv });
dotenvConfig();

const FEATURE_FILE = path.resolve(__dirname, '../features/Legal.feature');

const tagArg = process.argv.find((a) => a.startsWith('--tag='))?.split('=')[1]
  ?? (process.argv.includes('--tag') ? process.argv[process.argv.indexOf('--tag') + 1] : undefined);

runAuraCucumberAndReport({
  featurePaths: normalizeFeaturePaths([FEATURE_FILE]),
  tags: tagArg,
  reportTitle: 'AURA — Legal Test',
  runLabel: 'LegalTest',
}).then((code) => {
  if (code === 0) {
    console.log('\n✅ LegalTest PASSED');
  } else {
    console.error('\n❌ LegalTest FAILED');
    process.exit(1);
  }
}).catch((err) => {
  console.error('\n❌ LegalTest ERROR:', err);
  process.exit(1);
});
