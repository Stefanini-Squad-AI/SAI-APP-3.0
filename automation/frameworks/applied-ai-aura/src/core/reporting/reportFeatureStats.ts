/**
 * Agrupa escenarios Cucumber por feature (archivo .feature / nombre Gherkin)
 * para el desglose de suite en reportes AURA.
 */
import type { FeatureSuiteStat, ScenarioResult } from '../../types/index';

export function buildFeatureSuiteStats(scenarios: readonly ScenarioResult[]): {
  totalFeatures: number;
  featureStats: FeatureSuiteStat[];
} {
  type Acc = { passed: number; failed: number; skipped: number; pending: number; scenarioCount: number };
  const map = new Map<string, Acc>();

  for (const sc of scenarios) {
    const cur: Acc = map.get(sc.featureName) ?? {
      passed: 0,
      failed: 0,
      skipped: 0,
      pending: 0,
      scenarioCount: 0,
    };
    cur.scenarioCount += 1;
    if (sc.status === 'passed') cur.passed += 1;
    else if (sc.status === 'failed') cur.failed += 1;
    else if (sc.status === 'pending') cur.pending += 1;
    else cur.skipped += 1;
    map.set(sc.featureName, cur);
  }

  const featureStats: FeatureSuiteStat[] = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([featureName, c]) => ({
      featureName,
      scenarioCount: c.scenarioCount,
      passed: c.passed,
      failed: c.failed,
      skipped: c.skipped,
      pending: c.pending,
    }));

  return { totalFeatures: featureStats.length, featureStats };
}
