/**
 * AURA — POSSimulatorTest
 * Orchestrator for the POS Simulator payment flow.
 *
 * Direct execution:
 *   npx ts-node src/tests/POSSimulatorTest.ts
 *   npx ts-node src/tests/POSSimulatorTest.ts --tag @smoke
 */
import * as path from 'node:path';
import { config as dotenvConfig } from 'dotenv';
import { runAuraCucumberAndReport, normalizeFeaturePaths } from './auraRunner';

const rootEnv = path.resolve(__dirname, '..', '..', '..', '..', '..', '.env');
dotenvConfig({ path: rootEnv });
dotenvConfig();

const FEATURE_FILE = path.resolve(__dirname, '../features/POSSimulator.feature');

const tagArg = process.argv.find((a) => a.startsWith('--tag='))?.split('=')[1]
  ?? (process.argv.includes('--tag') ? process.argv[process.argv.indexOf('--tag') + 1] : undefined);

async function runPOSSimulatorTest(): Promise<void> {
  const exitCode = await runAuraCucumberAndReport({
    featurePaths: normalizeFeaturePaths([FEATURE_FILE]),
    tags: tagArg,
    reportTitle: 'AURA — POS Simulator Test',
    runLabel: 'POSSimulatorTest',
  });

  if (exitCode === 0) {
    console.log('\n✅ POSSimulatorTest PASSED');
  } else {
    console.error('\n❌ POSSimulatorTest FAILED');
    process.exit(1);
  }
}

runPOSSimulatorTest().catch((err) => {
  console.error('\n❌ POSSimulatorTest ERROR:', err);
  process.exit(1);
});
