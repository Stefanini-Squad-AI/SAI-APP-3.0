/**
 * AURA — LegalTest (SAIAPP3-21)
 * Programmatic orchestrator for the Legal Information page feature.
 *
 * Direct execution:
 *   npx ts-node src/tests/LegalTest.ts
 *   npx ts-node src/tests/LegalTest.ts --tag @legal
 *   npx ts-node src/tests/LegalTest.ts --tag @i18n
 */
import * as path from 'path';
import { execSync } from 'child_process';
import { TailwindReportEngine } from '../core/reporting/TailwindReportEngine';
import { ConfluenceExporter } from '../core/changelog/ConfluenceExporter';

// ─── Config ───────────────────────────────────────────────────────────────────

const FEATURE_FILE = path.relative(process.cwd(), path.resolve(__dirname, '../features/Legal.feature'));
const REPORT_DIR   = path.resolve(process.cwd(), 'reports');
const DOCS_DIR     = path.resolve(process.cwd(), 'docs');

const tagArg = process.argv.find((a) => a.startsWith('--tag='))?.split('=')[1]
  ?? (process.argv.includes('--tag') ? process.argv[process.argv.indexOf('--tag') + 1] : undefined);

// ─── Runner ───────────────────────────────────────────────────────────────────

async function runLegalTest(): Promise<void> {
  console.log('\n⚡ AURA — Running: LegalTest (SAIAPP3-21)');
  console.log(`   Feature : ${FEATURE_FILE}`);
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
      'AURA — Legal Information Page Test (SAIAPP3-21)',
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
    console.error('\n❌ LegalTest FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ LegalTest PASSED');
  }
}

runLegalTest().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
