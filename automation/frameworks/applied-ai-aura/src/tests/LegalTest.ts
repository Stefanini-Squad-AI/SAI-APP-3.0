/**
 * AURA — LegalTest
 * Orchestrator for the Legal Information page flow.
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

async function runLegalTest(): Promise<void> {
  const exitCode = await runAuraCucumberAndReport({
    featurePaths: normalizeFeaturePaths([FEATURE_FILE]),
    tags: tagArg,
    reportTitle: 'AURA — Legal Information Test',
    runLabel: 'LegalTest',
  });

  if (exitCode === 0) {
    console.log('\n✅ LegalTest PASSED');
  } else {
    console.error('\n❌ LegalTest FAILED');
    process.exit(1);
  }
}

runLegalTest().catch((err) => {
  console.error('\n❌ LegalTest ERROR:', err);
  process.exit(1);
});
