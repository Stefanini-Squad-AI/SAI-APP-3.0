/**
 * AURA — Runner unificado: una sola invocación a Cucumber → un único cucumber-report.json
 * → un solo informe bajo reports/<fecha>/<suite>/vN/aura-report.html
 */
import { copyFileSync, existsSync } from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { TailwindReportEngine } from '../core/reporting/TailwindReportEngine';
import { ConfluenceExporter } from '../core/changelog/ConfluenceExporter';
import { allocateVersionedRunDirectory } from '../core/reporting/reportRunDirectory';

const REPORT_DIR = path.resolve(process.cwd(), 'reports');
const DOCS_DIR = path.resolve(process.cwd(), 'docs');

export interface AuraTestRunOptions {
  readonly featurePaths: string[];
  readonly tags?: string;
  readonly reportTitle: string;
  readonly runLabel: string;
  /**
   * Carpeta bajo la fecha (ej. Home, Login, Regresion).
   * Si se omite: un .feature → nombre del archivo; varios → Regresion.
   */
  readonly suiteFolder?: string;
  /** Nombre del HTML dentro de la carpeta vN (por defecto aura-report.html). */
  readonly reportFilename?: string;
  readonly skipConfluence?: boolean;
}

/**
 * Un .feature → basename (Home). Varios → Regresion.
 */
export function deriveSuiteFolderFromFeaturePaths(featurePaths: string[]): string {
  const rel = normalizeFeaturePaths(featurePaths);
  if (rel.length === 1) {
    return path.basename(rel[0], '.feature');
  }
  return 'Regresion';
}

/**
 * Convierte rutas a relativas al cwd para la CLI de Cucumber.
 * Si el archivo es solo `Algo.feature`, se busca en `src/features/`.
 */
export function normalizeFeaturePaths(paths: string[]): string[] {
  return paths.map((p) => {
    if (path.isAbsolute(p)) {
      return path.relative(process.cwd(), p).replaceAll('\\', '/');
    }
    const clean = p.replaceAll('\\', '/');
    if (clean.includes('/')) {
      return path.relative(process.cwd(), path.resolve(process.cwd(), p)).replaceAll('\\', '/');
    }
    return path
      .relative(process.cwd(), path.resolve(process.cwd(), 'src/features', p))
      .replaceAll('\\', '/');
  });
}

function runCucumber(featurePathsRel: string[], tags: string | undefined, runDir: string, suiteFolder: string): number {
  const cli = path.join(process.cwd(), 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
  if (!existsSync(cli)) {
    console.error('[AURA] No se encontró Cucumber en:', cli);
    return 1;
  }
  const args = [...featurePathsRel];
  if (tags) args.push('--tags', tags);
  const r = spawnSync(process.execPath, [cli, ...args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      AURA_RUN_REPORT_DIR: runDir,
      AURA_SUITE_FOLDER: suiteFolder,
    },
  });
  return r.status === 0 ? 0 : 1;
}

export async function runAuraCucumberAndReport(opts: AuraTestRunOptions): Promise<number> {
  const rel = normalizeFeaturePaths(opts.featurePaths);
  const suiteFolder = opts.suiteFolder ?? deriveSuiteFolderFromFeaturePaths(opts.featurePaths);
  const runDir = allocateVersionedRunDirectory('reports', suiteFolder);

  process.env['AURA_RUN_REPORT_DIR'] = runDir;
  process.env['AURA_SUITE_FOLDER'] = suiteFolder;

  console.log(`\n⚡ AURA — ${opts.runLabel}`);
  console.log(`   Features: ${rel.join(', ')}`);
  console.log(`   Suite:    ${suiteFolder}`);
  console.log(`   Carpeta:  ${runDir}`);
  if (opts.tags) console.log(`   Tags:     ${opts.tags}`);
  console.log('');

  const twName = opts.reportFilename ?? 'aura-report.html';
  const prevFilename = process.env['AURA_REPORT_FILENAME'];
  process.env['AURA_REPORT_FILENAME'] = twName;

  let exitCode: number;
  try {
    exitCode = runCucumber(rel, opts.tags, runDir, suiteFolder);

    const cucumberJsonRoot = path.join(REPORT_DIR, 'cucumber-report.json');

    try {
      if (existsSync(cucumberJsonRoot)) {
        copyFileSync(cucumberJsonRoot, path.join(runDir, 'cucumber-report.json'));
      }
      const reportTitle =
        process.env['AURA_REPORT_TITLE']?.trim() || opts.reportTitle;
      const engine = new TailwindReportEngine(cucumberJsonRoot, runDir, reportTitle);
      const { htmlPath } = await engine.generate();
      console.log(`\n📊 Informe Tailwind (todos los escenarios) → ${htmlPath}`);
    } catch (err) {
      console.warn('[AURA] Falló la generación del informe HTML:', (err as Error).message ?? err);
    }
  } finally {
    if (prevFilename === undefined) delete process.env['AURA_REPORT_FILENAME'];
    else process.env['AURA_REPORT_FILENAME'] = prevFilename;
  }

  if (!opts.skipConfluence) {
    try {
      new ConfluenceExporter(
        DOCS_DIR,
        'SAI',
        process.env['AURA_REPORT_VERSION'] ?? '1.0.0',
      ).export();
    } catch { /* no crítico */ }
  }

  return exitCode;
}
