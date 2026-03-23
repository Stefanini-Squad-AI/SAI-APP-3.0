/**
 * Estructura de carpetas por ejecución:
 *   <baseDir>/<YYYY-MM-DD>/<suiteFolder>/vN/
 * Ej.: reports/2026-03-23/Home/v1/
 * Regresión multi-feature: reports/2026-03-23/Regresion/v1/
 */
import * as fs from 'fs';
import * as path from 'path';

export function sanitizeSuiteFolder(name: string): string {
  const s = name
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return s.length > 0 ? s : 'Suite';
}

/**
 * Crea la siguiente carpeta de versión vacía (v1, v2, …) bajo fecha + suite.
 */
export function allocateVersionedRunDirectory(baseDir: string, suiteFolder: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const safe = sanitizeSuiteFolder(suiteFolder);
  const suitePath = path.resolve(baseDir, today, safe);
  fs.mkdirSync(suitePath, { recursive: true });

  let v = 1;
  while (fs.existsSync(path.join(suitePath, `v${v}`))) {
    v += 1;
  }
  const runDir = path.join(suitePath, `v${v}`);
  fs.mkdirSync(runDir, { recursive: true });
  return runDir;
}
