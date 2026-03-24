/**
 * AURA — AuraSuiteTest
 * Ejecuta varios .feature en una sola corrida Cucumber y un único informe Tailwind.
 *
 * Ejemplos:
 *   ts-node src/tests/AuraSuiteTest.ts
 *   ts-node src/tests/AuraSuiteTest.ts --tags @smoke
 *   ts-node src/tests/AuraSuiteTest.ts --tags @home
 *   ts-node src/tests/AuraSuiteTest.ts --tags @home-hero
 *   ts-node src/tests/AuraSuiteTest.ts src/features/Home.feature src/features/Login.feature --tags @smoke
 */
import * as path from 'node:path';
import { config as dotenvConfig } from 'dotenv';
import { runAuraCucumberAndReport, normalizeFeaturePaths } from './auraRunner';

const rootEnv = path.resolve(__dirname, '..', '..', '..', '..', '..', '.env');
dotenvConfig({ path: rootEnv });
dotenvConfig();

const DEFAULT_FEATURES = ['src/features/Home.feature', 'src/features/Login.feature'];

interface ParsedCli {
  tags?: string;
  features: string[];
  title?: string;
}

function parseArgs(argv: string[]): ParsedCli {
  const features: string[] = [];
  let tags: string | undefined;
  let title: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--tags' || a === '--tag') {
      tags = argv[++i];
    } else if (a.startsWith('--tags=')) {
      tags = a.slice('--tags='.length);
    } else if (a.startsWith('--tag=')) {
      tags = a.slice('--tag='.length);
    } else if (a === '--title') {
      title = argv[++i];
    } else if (a.startsWith('--title=')) {
      title = a.slice('--title='.length);
    } else if (!a.startsWith('-')) {
      features.push(a);
    }
  }
  return { tags, features, title };
}

async function main(): Promise<void> {
  const { tags, features, title } = parseArgs(process.argv.slice(2));
  const featurePaths = features.length > 0 ? features : DEFAULT_FEATURES;
  const reportTitle =
    title ??
    process.env['AURA_SUITE_TITLE']?.trim() ??
    process.env['AURA_REPORT_TITLE']?.trim() ??
    'SAI Test Report';
  const reportFilename = process.env['AURA_REPORT_FILENAME']?.trim() || undefined;

  const exitCode = await runAuraCucumberAndReport({
    featurePaths: normalizeFeaturePaths(featurePaths),
    tags,
    reportTitle,
    runLabel: 'AuraSuiteTest',
    reportFilename,
  });

  if (exitCode !== 0) {
    console.error('\n❌ AuraSuiteTest FAILED');
    process.exit(1);
  }
  console.log('\n✅ AuraSuiteTest PASSED');
}

main().catch((err) => {
  console.error('\n AuraSuiteTest ERROR:', err);
  process.exit(1);
});
