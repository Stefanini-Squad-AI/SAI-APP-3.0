import * as path from 'path';
import { config as dotenvConfig } from 'dotenv';
import { execSync } from 'child_process';
import { TailwindReportEngine } from '../core/reporting/TailwindReportEngine';

const rootEnv = path.resolve(__dirname, '..', '..', '..', '..', '..', '.env');
dotenvConfig({ path: rootEnv });
dotenvConfig();

const FEATURE_FILE = path.relative(
  process.cwd(),
  path.resolve(__dirname, '../features/LegalInfo.feature'),
);
const REPORT_DIR = path.resolve(process.cwd(), 'reports');

const tagArg =
  process.argv.find((a) => a.startsWith('--tag='))?.split('=')[1] ??
  (process.argv.includes('--tag')
    ? process.argv[process.argv.indexOf('--tag') + 1]
    : undefined);

async function runAuraTest(): Promise<void> {
  console.log('\n⚡ AURA — Running: LegalInfoTest');
  console.log(`   Feature : ${FEATURE_FILE}`);
  if (tagArg) console.log(`   Tags    : ${tagArg}`);
  console.log('');

  const tagFlag = tagArg ? `--tags "${tagArg}"` : '';
  const cmd = ['npx cucumber-js', FEATURE_FILE, tagFlag].filter(Boolean).join(' ');

  let exitCode = 0;
  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
  } catch {
    exitCode = 1;
  }

  try {
    const engine = new TailwindReportEngine(
      path.join(REPORT_DIR, 'cucumber-report.json'),
      REPORT_DIR,
      'AURA — LegalInfo Test',
    );
    const { htmlPath } = await engine.generate();
    console.log(`\n📊 HTML report → ${htmlPath}`);
  } catch (err) {
    console.warn('[AURA] Failed to generate HTML report:', (err as Error).message ?? err);
  }

  if (exitCode !== 0) {
    console.error('\n❌ LegalInfoTest FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ LegalInfoTest PASSED');
  }
}

runAuraTest().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
