/**
 * AURA — LegalInformationTest
 * Orchestrator for the Legal Information page flow.
 *
 * Direct execution:
 *   npx ts-node src/tests/LegalInformationTest.ts
 *   npx ts-node src/tests/LegalInformationTest.ts --tag @smoke
 *
 * CI execution:
 *   npx cucumber-js --tags "@smoke or @preview" (from AURA working directory)
 *   Tests run against AURA_TARGET_URL (deployed PR preview)
 *   Video recording enabled: AURA_RECORD_VIDEO=true
 *   Report: reports/**/aura-report.html (published to Surge)
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

async function runLegalInformationTest(): Promise<void> {
  const exitCode = await runAuraCucumberAndReport({
    featurePaths: normalizeFeaturePaths([FEATURE_FILE]),
    tags: tagArg,
    reportTitle: 'AURA — Legal Information Test',
    runLabel: 'LegalInformationTest',
  });

  if (exitCode === 0) {
    console.log('\n✅ LegalInformationTest PASSED');
  } else {
    console.error('\n❌ LegalInformationTest FAILED');
    process.exit(1);
  }
}

runLegalInformationTest().catch((err) => {
  console.error('\n❌ LegalInformationTest ERROR:', err);
  process.exit(1);
});

