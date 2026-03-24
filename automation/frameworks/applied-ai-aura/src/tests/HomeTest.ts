/**
 * AURA — HomeTest
 * Programmatic orchestrator for the TuCreditoOnline home page flow.
 *
 * Direct execution:
 *   npx ts-node src/tests/HomeTest.ts
 *   npx ts-node src/tests/HomeTest.ts --tag @smoke
 */
import * as path from 'path';
import { config as dotenvConfig } from 'dotenv';
import { runAuraCucumberAndReport, normalizeFeaturePaths } from './auraRunner';

const rootEnv = path.resolve(__dirname, '..', '..', '..', '..', '..', '.env');
dotenvConfig({ path: rootEnv });
dotenvConfig();

const FEATURE_FILE = path.resolve(__dirname, '../features/Home.feature');

const tagArg   = process.argv.find((a) => a.startsWith('--tag='))?.split('=')[1]
  ?? (process.argv.includes('--tag') ? process.argv[process.argv.indexOf('--tag') + 1] : undefined);

async function runHomeTest(): Promise<void> {
  const exitCode = await runAuraCucumberAndReport({
    featurePaths: normalizeFeaturePaths([FEATURE_FILE]),
    tags: tagArg,
    reportTitle: 'AURA — Home Test',
    runLabel: 'HomeTest',
  });

  if (exitCode !== 0) {
    console.error('\n❌ HomeTest FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ HomeTest PASSED');
  }
}

runHomeTest().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
