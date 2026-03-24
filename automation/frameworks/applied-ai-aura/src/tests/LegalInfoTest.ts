/**
 * AURA — LegalInfoTest
 * Orchestrator for the public legal information page flow.
 *
 * Direct execution:
 *   npx ts-node src/tests/LegalInfoTest.ts
 *   npx ts-node src/tests/LegalInfoTest.ts --tag @preview
 */
import * as path from 'path';
import { config as dotenvConfig } from 'dotenv';
import { runAuraCucumberAndReport, normalizeFeaturePaths } from './auraRunner';

const rootEnv = path.resolve(__dirname, '..', '..', '..', '..', '..', '.env');
dotenvConfig({ path: rootEnv });
dotenvConfig();

const FEATURE_FILE = path.resolve(__dirname, '../features/LegalInfo.feature');

const tagArg =
  process.argv.find((a) => a.startsWith('--tag='))?.split('=')[1] ??
  (process.argv.includes('--tag') ? process.argv[process.argv.indexOf('--tag') + 1] : undefined);

async function runLegalInfoTest(): Promise<void> {
  const exitCode = await runAuraCucumberAndReport({
    featurePaths: normalizeFeaturePaths([FEATURE_FILE]),
    tags: tagArg,
    reportTitle: 'AURA — Legal Information Test',
    runLabel: 'LegalInfoTest',
  });

  if (exitCode !== 0) {
    console.error('\n❌ LegalInfoTest FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ LegalInfoTest PASSED');
  }
}

runLegalInfoTest().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
