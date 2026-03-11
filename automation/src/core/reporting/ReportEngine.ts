/**
 * AURA — Report Engine
 * Transforms cucumber-messages.ndjson into a typed ReportSummary
 * and orchestrates the HTML dashboard generation.
 */
import * as fs from 'fs';
import * as path from 'path';
import type {
  ReportSummary,
  ScenarioResult,
  StepResult,
  TestStatus,
  StepId,
} from '../../types/index';
import { ChangelogRegistry } from '../changelog/ChangelogRegistry';
import { HTMLDashboard } from './HTMLDashboard';

// ─── Cucumber JSON Shape (subset we actually use) ─────────────────────────────

interface CucumberStep {
  text: string;
  result?: { status: string; duration?: number; error_message?: string };
  embeddings?: Array<{ data: string; mime_type: string }>;
}

interface CucumberScenario {
  id: string;
  name: string;
  tags?: Array<{ name: string }>;
  steps?: CucumberStep[];
  start_timestamp?: string;
}

interface CucumberFeature {
  name: string;
  elements?: CucumberScenario[];
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class ReportEngine {
  constructor(
    private readonly inputPath: string,
    private readonly outputDir: string,
    private readonly reportTitle: string = 'SAI Test Report',
    private readonly theme: 'dark' | 'light' = 'dark',
  ) {}

  async generate(): Promise<ReportSummary> {
    const features = this.loadCucumberJSON();
    const scenarios = this.parseScenarios(features);
    const summary = this.buildSummary(scenarios);
    this.writeOutputs(summary);
    return summary;
  }

  // ─── Parsing ───────────────────────────────────────────────────────────────

  private loadCucumberJSON(): CucumberFeature[] {
    if (!fs.existsSync(this.inputPath)) {
      throw new Error(`[AURA/Report] Input not found: ${this.inputPath}`);
    }
    const raw = fs.readFileSync(this.inputPath, 'utf-8');
    return JSON.parse(raw) as CucumberFeature[];
  }

  private parseScenarios(features: CucumberFeature[]): ScenarioResult[] {
    const results: ScenarioResult[] = [];

    for (const feature of features) {
      for (const scenario of feature.elements ?? []) {
        const steps = this.parseSteps(scenario.steps ?? []);
        const durationMs = steps.reduce((sum, s) => sum + s.durationMs, 0);
        const hasFailure = steps.some((s) => s.status === 'failed');
        const hasPending = steps.some((s) => s.status === 'pending');
        const hasSkipped = steps.every((s) => s.status === 'skipped');

        const status: TestStatus = hasFailure
          ? 'failed'
          : hasPending
          ? 'pending'
          : hasSkipped
          ? 'skipped'
          : 'passed';

        const startedAt = scenario.start_timestamp ?? new Date().toISOString();
        const finishedAt = new Date(
          new Date(startedAt).getTime() + durationMs,
        ).toISOString();

        results.push({
          id: scenario.id,
          name: scenario.name,
          featureName: feature.name,
          tags: (scenario.tags ?? []).map((t) => t.name),
          status,
          durationMs,
          steps,
          startedAt,
          finishedAt,
        });
      }
    }

    return results;
  }

  private parseSteps(rawSteps: CucumberStep[]): StepResult[] {
    return rawSteps.map((step, idx): StepResult => {
      const status = this.mapStatus(step.result?.status ?? 'skipped');
      const durationNs = step.result?.duration ?? 0;
      const durationMs = Math.round(durationNs / 1_000_000);

      const screenshot = (step.embeddings ?? []).find((e) =>
        e.mime_type.startsWith('image/'),
      )?.data;

      return {
        id: `step-${idx}` as StepId,
        text: step.text,
        status,
        durationMs,
        error: step.result?.error_message,
        screenshot: screenshot ? `data:image/png;base64,${screenshot}` : undefined,
        intents: [],
      };
    });
  }

  private mapStatus(cucumberStatus: string): TestStatus {
    const map: Record<string, TestStatus> = {
      passed: 'passed',
      failed: 'failed',
      skipped: 'skipped',
      pending: 'pending',
      undefined: 'pending',
      ambiguous: 'failed',
    };
    return map[cucumberStatus.toLowerCase()] ?? 'skipped';
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  private buildSummary(scenarios: ScenarioResult[]): ReportSummary {
    const passed = scenarios.filter((s) => s.status === 'passed').length;
    const failed = scenarios.filter((s) => s.status === 'failed').length;
    const skipped = scenarios.filter((s) => s.status === 'skipped').length;
    const pending = scenarios.filter((s) => s.status === 'pending').length;
    const total = scenarios.length;
    const durationMs = scenarios.reduce((sum, s) => sum + s.durationMs, 0);

    return {
      title: this.reportTitle,
      generatedAt: new Date().toISOString(),
      totalScenarios: total,
      passed,
      failed,
      skipped,
      pending,
      durationMs,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      scenarios,
      changelog: ChangelogRegistry.getInstance().getAll(),
    };
  }

  // ─── Output ────────────────────────────────────────────────────────────────

  private writeOutputs(summary: ReportSummary): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const jsonPath = path.join(this.outputDir, 'aura-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

    const htmlPath = path.join(this.outputDir, 'aura-report.html');
    const dashboard = new HTMLDashboard(this.theme);
    fs.writeFileSync(htmlPath, dashboard.render(summary));

    console.log(`[AURA/Report] ✓ JSON  → ${jsonPath}`);
    console.log(`[AURA/Report] ✓ HTML  → ${htmlPath}`);
  }
}

// CLI entrypoint: `ts-node src/core/reporting/ReportEngine.ts`
if (require.main === module) {
  const inputPath = process.env['AURA_REPORT_INPUT'] ?? 'reports/cucumber-report.json';
  const outputDir = process.env['AURA_REPORT_OUTPUT'] ?? 'reports';
  const title = process.env['AURA_REPORT_TITLE'] ?? 'SAI Test Report';
  const theme = (process.env['AURA_REPORT_THEME'] ?? 'dark') as 'dark' | 'light';

  new ReportEngine(inputPath, outputDir, title, theme)
    .generate()
    .then(() => console.log('[AURA/Report] Report generation complete.'))
    .catch(console.error);
}
