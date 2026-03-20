/**
 * AURA — LegalInfoTest
 * Programmatic orchestrator for the Legal Information page feature (SAIAPP3-22).
 *
 * Direct execution:
 *   npx ts-node src/tests/LegalInfoTest.ts
 *   npx ts-node src/tests/LegalInfoTest.ts --tag @navegacion
 *   npx ts-node src/tests/LegalInfoTest.ts --tag @i18n
 *   npx ts-node src/tests/LegalInfoTest.ts --tag @preview
 */
import * as path from 'path';
import { config as dotenvConfig } from 'dotenv';
import { execSync } from 'child_process';
import { TailwindReportEngine } from '../core/reporting/TailwindReportEngine';
import { ConfluenceExporter } from '../core/changelog/ConfluenceExporter';

const rootEnv = path.resolve(__dirname, '..', '..', '..', '..', '..', '.env');
dotenvConfig({ path: rootEnv });
dotenvConfig();

// ─── Config ───────────────────────────────────────────────────────────────────

const FEATURE_FILE = path.relative(process.cwd(), path.resolve(__dirname, '../features/LegalInfo.feature'));
const REPORT_DIR   = path.resolve(process.cwd(), 'reports');
const DOCS_DIR     = path.resolve(process.cwd(), 'docs');

const tagArg = process.argv.find((a) => a.startsWith('--tag='))?.split('=')[1]
  ?? (process.argv.includes('--tag') ? process.argv[process.argv.indexOf('--tag') + 1] : undefined);

// ─── Runner ───────────────────────────────────────────────────────────────────

async function runLegalInfoTest(): Promise<void> {
  console.log('\n⚡ AURA — Running: LegalInfoTest (SAIAPP3-22)');
  console.log(`   Feature : ${FEATURE_FILE}`);
  console.log(`   Target  : ${process.env['AURA_TARGET_URL'] ?? '(not set — set AURA_TARGET_URL)'}`);
  if (tagArg) console.log(`   Tags    : ${tagArg}`);
  console.log('');

  const tagFlag = tagArg ? `--tags "${tagArg}"` : '';
  const cmd = [
    'npx cucumber-js',
    FEATURE_FILE,
    tagFlag,
  ].filter(Boolean).join(' ');

  let exitCode = 0;
  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
  } catch {
    exitCode = 1;
  }

  // ── Post-run reporting ─────────────────────────────────────────────────────
  const cucumberJson = path.join(REPORT_DIR, 'cucumber-report.json');

  try {
    const engine = new TailwindReportEngine(
      cucumberJson,
      REPORT_DIR,
      'AURA — LegalInfo Test (SAIAPP3-22)',
    );
    const { htmlPath } = await engine.generate();
    console.log(`\n📊 HTML report → ${htmlPath}`);
  } catch (err) {
    console.warn('[AURA] Failed to generate HTML report:', (err as Error).message ?? err);
  }

  try {
    new ConfluenceExporter(
      DOCS_DIR,
      'SAI',
      process.env['AURA_REPORT_VERSION'] ?? '1.0.0',
    ).export();
  } catch { /* non-critical */ }

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
