/**
 * AURA — LoginTest
 * Programmatic orchestrator for the login flow.
 *
 * Direct execution:
 *   npx ts-node src/tests/LoginTest.ts
 *   npx ts-node src/tests/LoginTest.ts --tag @smoke
 */
import * as path from 'path';
import { config as dotenvConfig } from 'dotenv';
import { runAuraCucumberAndReport, normalizeFeaturePaths } from './auraRunner';

const rootEnv = path.resolve(__dirname, '..', '..', '..', '..', '..', '.env');
dotenvConfig({ path: rootEnv });
dotenvConfig();

const FEATURE_FILE = path.resolve(__dirname, '../features/Login.feature');

const tagArg   = process.argv.find((a) => a.startsWith('--tag='))?.split('=')[1]
  ?? (process.argv.includes('--tag') ? process.argv[process.argv.indexOf('--tag') + 1] : undefined);

async function runLoginTest(): Promise<void> {
  const exitCode = await runAuraCucumberAndReport({
    featurePaths: normalizeFeaturePaths([FEATURE_FILE]),
    tags: tagArg,
    reportTitle: 'AURA — Login Test',
    runLabel: 'LoginTest',
  });

  if (exitCode !== 0) {
    console.error('\n❌ LoginTest FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ LoginTest PASSED');
  }
}

runLoginTest().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
