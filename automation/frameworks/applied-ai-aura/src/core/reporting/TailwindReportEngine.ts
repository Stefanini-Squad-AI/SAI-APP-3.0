/**
 * AURA — Tailwind Report Engine
 * Generates self-contained HTML reports with TailwindCSS + Chart.js + Bootstrap Icons.
 * Naming: report-{testName}-{YYYYMMDD}-v{version}.html
 *
 * Features:
 *  - Dashboard with animated KPIs
 *  - Donut chart for pass-rate (Chart.js)
 *  - Scenario timeline with collapsible steps
 *  - Embedded base64 screenshots
 *  - Intent trace section for debugging
 *  - Dark/Light mode toggle
 *  - 100% self-contained: Tailwind CDN + Chart.js CDN
 */
import * as fs from 'fs';
import * as path from 'path';
import type {
  ReportSummary,
  ScenarioResult,
  StepResult,
  TestStatus,
} from '../../types/index';
import { ChangelogRegistry } from '../changelog/ChangelogRegistry';

// ─── Report File Naming ───────────────────────────────────────────────────────

export function buildReportFileName(testName: string, version?: string): string {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
  const versionPart = version ?? process.env['AURA_REPORT_VERSION'] ?? '1.0.0';
  const safeName = testName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  return `report-${safeName}-${datePart}-v${versionPart}.html`;
}

function resolveVersion(outputDir: string, testName: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const safeName = testName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const prefix = `report-${safeName}-${date}-v`;

  if (!fs.existsSync(outputDir)) return '1.0.0';

  const existing = fs.readdirSync(outputDir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.html'))
    .map((f) => {
      const match = /v(\d+\.\d+\.\d+)\.html$/.exec(f);
      return match ? match[1] : null;
    })
    .filter((v): v is string => v !== null);

  if (existing.length === 0) return '1.0.0';

  const latest = existing.sort((a, b) => {
    const [ma, mi, pa] = a.split('.').map(Number);
    const [mb, mi2, pb] = b.split('.').map(Number);
    if (ma !== mb) return mb - ma;
    if (mi !== mi2) return mi2 - mi;
    return pb - pa;
  })[0];

  const [major, minor, patch] = (latest ?? '1.0.0').split('.').map(Number);
  return `${major}.${minor}.${(patch ?? 0) + 1}`;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class TailwindReportEngine {
  constructor(
    private readonly inputPath: string,
    private readonly outputDir: string,
    private readonly reportTitle: string = process.env['AURA_REPORT_TITLE'] ?? 'SAI Test Report',
    private readonly theme: 'dark' | 'light' = (process.env['AURA_REPORT_THEME'] ?? 'dark') as 'dark' | 'light',
  ) {}

  async generate(): Promise<{ htmlPath: string; jsonPath: string; summary: ReportSummary }> {
    const features = this.loadCucumberJSON();
    const scenarios = this.parseScenarios(features);
    const summary = this.buildSummary(scenarios);

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const testName = this.reportTitle.replace(/\s+/g, '_');
    const version = resolveVersion(this.outputDir, testName);
    const fileName = buildReportFileName(testName, version);

    const htmlPath = path.join(this.outputDir, fileName);
    const jsonPath = path.join(this.outputDir, fileName.replace('.html', '.json'));

    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
    fs.writeFileSync(htmlPath, this.renderHTML(summary, version));

    console.log(`[AURA/Report] ✓ JSON  → ${jsonPath}`);
    console.log(`[AURA/Report] ✓ HTML  → ${htmlPath}`);

    return { htmlPath, jsonPath, summary };
  }

  // ─── Parsing ───────────────────────────────────────────────────────────────

  private loadCucumberJSON(): CucumberFeature[] {
    if (!fs.existsSync(this.inputPath)) {
      return [];
    }
    const raw = fs.readFileSync(this.inputPath, 'utf-8');
    return JSON.parse(raw) as CucumberFeature[];
  }

  private parseScenarios(features: CucumberFeature[]): ScenarioResult[] {
    const results: ScenarioResult[] = [];
    for (const feature of features) {
      for (const scenario of feature.elements ?? []) {
        const steps = this.parseSteps(scenario.steps ?? []);
        const durationMs = steps.reduce((s, st) => s + st.durationMs, 0);
        const hasFailure = steps.some((s) => s.status === 'failed');
        const hasPending = steps.some((s) => s.status === 'pending');
        const allSkipped = steps.every((s) => s.status === 'skipped');

        const status: TestStatus = hasFailure ? 'failed'
          : hasPending ? 'pending'
          : allSkipped ? 'skipped'
          : 'passed';

        const startedAt = scenario.start_timestamp ?? new Date().toISOString();
        results.push({
          id: scenario.id,
          name: scenario.name,
          featureName: feature.name,
          tags: (scenario.tags ?? []).map((t) => t.name),
          status,
          durationMs,
          steps,
          startedAt,
          finishedAt: new Date(new Date(startedAt).getTime() + durationMs).toISOString(),
        });
      }
    }
    return results;
  }

  private parseSteps(raw: CucumberStep[]): StepResult[] {
    return raw.map((step, idx): StepResult => {
      const status = this.mapStatus(step.result?.status ?? 'skipped');
      const durationMs = Math.round((step.result?.duration ?? 0) / 1_000_000);
      const screenshot = (step.embeddings ?? [])
        .find((e) => e.mime_type.startsWith('image/'))?.data;

      return {
        id: `step-${idx}` as Parameters<typeof String>[0] & { readonly __brand: 'StepId' },
        text: step.text,
        status,
        durationMs,
        error: step.result?.error_message,
        screenshot: screenshot ? `data:image/png;base64,${screenshot}` : undefined,
        intents: [],
      };
    });
  }

  private mapStatus(s: string): TestStatus {
    const m: Record<string, TestStatus> = {
      passed: 'passed', failed: 'failed', skipped: 'skipped',
      pending: 'pending', undefined: 'pending', ambiguous: 'failed',
    };
    return m[s.toLowerCase()] ?? 'skipped';
  }

  private buildSummary(scenarios: ScenarioResult[]): ReportSummary {
    const passed  = scenarios.filter((s) => s.status === 'passed').length;
    const failed  = scenarios.filter((s) => s.status === 'failed').length;
    const skipped = scenarios.filter((s) => s.status === 'skipped').length;
    const pending = scenarios.filter((s) => s.status === 'pending').length;
    const total   = scenarios.length;
    const durationMs = scenarios.reduce((s, sc) => s + sc.durationMs, 0);

    return {
      title: this.reportTitle,
      generatedAt: new Date().toISOString(),
      totalScenarios: total,
      passed, failed, skipped, pending,
      durationMs,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      scenarios,
      changelog: ChangelogRegistry.getInstance().getAll(),
    };
  }

  // ─── HTML Generation ──────────────────────────────────────────────────────

  private renderHTML(summary: ReportSummary, version: string): string {
    const isDark = this.theme === 'dark';
    const genDate = new Date(summary.generatedAt).toLocaleString('en-US', {
      dateStyle: 'long', timeStyle: 'short',
    });
    const duration = this.fmtDuration(summary.durationMs);
    const passColor = summary.failed > 0 ? '#ef4444' : '#22c55e';
    const passLabel = summary.failed > 0 ? 'FAILED' : 'PASSED';

    return `<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>AURA Report — ${this.escape(summary.title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            aura: { DEFAULT: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
            surface: { DEFAULT: '#18181b', card: '#1c1c1f', border: '#27272a' },
          },
          fontFamily: {
            sans: ['-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','sans-serif'],
            mono: ['Fira Code','Cascadia Code','Consolas','monospace'],
          },
        }
      }
    }
  </script>
  <style>
    html { scroll-behavior: smooth; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .tab-btn { border-bottom: 2px solid transparent; }
    .tab-btn.active { border-bottom-color: #6366f1; color: #6366f1; }
    .step-body { display: none; }
    .step-body.open { display: table-row-group; }
    .chevron { transition: transform .2s; }
    .chevron.open { transform: rotate(90deg); }
    .kpi-val { font-variant-numeric: tabular-nums; }
    @keyframes countUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .kpi-val { animation: countUp .4s ease-out both; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
  </style>
</head>
<body class="${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'} min-h-screen font-sans">

${this.renderHeader(summary, version, genDate, duration, passLabel, passColor, isDark)}
${this.renderNav(isDark)}
<main class="container mx-auto px-4 py-6 max-w-7xl">
  <!-- Tab: Summary -->
  <div id="tab-summary" class="tab-content active">
    ${this.renderKPIs(summary, isDark)}
    ${this.renderCharts(summary, isDark)}
  </div>
  <!-- Tab: Scenarios -->
  <div id="tab-scenarios" class="tab-content">
    ${this.renderScenarios(summary.scenarios, isDark)}
  </div>
  <!-- Tab: ChangeLog -->
  <div id="tab-changelog" class="tab-content">
    ${this.renderChangelog(summary, isDark)}
  </div>
</main>

${this.renderFooter(summary, version, isDark)}
${this.renderScript(summary)}
</body>
</html>`;
  }

  // ─── Header ──────────────────────────────────────────────────────────────

  private renderHeader(
    s: ReportSummary,
    version: string,
    genDate: string,
    duration: string,
    passLabel: string,
    passColor: string,
    isDark: boolean,
  ): string {
    const headerBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200';
    return `
<header class="${headerBg} border-b sticky top-0 z-50 backdrop-blur">
  <div class="container mx-auto px-4 py-3 max-w-7xl">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-lg shadow-lg shadow-indigo-500/25">⚡</div>
        <div>
          <div class="text-lg font-bold tracking-tight">AURA</div>
          <div class="${isDark ? 'text-zinc-400' : 'text-slate-500'} text-xs">Test Automation Framework</div>
        </div>
        <div class="hidden sm:block w-px h-8 ${isDark ? 'bg-zinc-700' : 'bg-slate-200'}"></div>
        <div class="hidden sm:block">
          <div class="text-base font-semibold">${this.escape(s.title)}</div>
          <div class="${isDark ? 'text-zinc-400' : 'text-slate-500'} text-xs">v${version} · ${genDate}</div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}"><i class="bi bi-clock"></i> ${duration}</span>
        <span class="px-3 py-1.5 rounded-lg text-xs font-bold" style="background:${passColor}20;color:${passColor}">
          <i class="bi bi-${s.failed > 0 ? 'x-circle' : 'check-circle'}"></i> ${passLabel}
        </span>
        <button onclick="toggleTheme()" class="${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'} p-2 rounded-lg transition" title="Toggle theme">
          <i class="bi bi-circle-half"></i>
        </button>
      </div>
    </div>
  </div>
</header>`;
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  private renderNav(isDark: boolean): string {
    const bg = isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-slate-200';
    return `
<nav class="${bg} border-b backdrop-blur">
  <div class="container mx-auto px-4 max-w-7xl">
    <div class="flex gap-1">
      <button onclick="switchTab('summary')" id="btn-summary"
        class="tab-btn active px-4 py-3 text-sm font-medium ${isDark ? 'text-zinc-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition">
        <i class="bi bi-grid-3x3-gap mr-1.5"></i>Summary
      </button>
      <button onclick="switchTab('scenarios')" id="btn-scenarios"
        class="tab-btn px-4 py-3 text-sm font-medium ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-700'} transition">
        <i class="bi bi-list-check mr-1.5"></i>Scenarios
      </button>
      <button onclick="switchTab('changelog')" id="btn-changelog"
        class="tab-btn px-4 py-3 text-sm font-medium ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-700'} transition">
        <i class="bi bi-clock-history mr-1.5"></i>ChangeLog
      </button>
    </div>
  </div>
</nav>`;
  }

  // ─── KPIs ─────────────────────────────────────────────────────────────────

  private renderKPIs(s: ReportSummary, isDark: boolean): string {
    const cardBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200';
    const kpis = [
      { label: 'Total',    value: s.totalScenarios, icon: 'bi-collection',    color: '#6366f1' },
      { label: 'Passed', value: s.passed,          icon: 'bi-check-circle',  color: '#22c55e' },
      { label: 'Failed', value: s.failed,           icon: 'bi-x-circle',     color: '#ef4444' },
      { label: 'Skipped', value: s.skipped + s.pending, icon: 'bi-skip-forward', color: '#6b7280' },
      { label: 'Pass Rate', value: `${s.passRate}%`, icon: 'bi-speedometer2', color: s.passRate >= 80 ? '#22c55e' : s.passRate >= 50 ? '#eab308' : '#ef4444' },
    ];

    const cards = kpis.map(({ label, value, icon, color }) => `
<div class="${cardBg} border rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform">
  <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style="background:${color}18;color:${color}">
    <i class="bi ${icon}"></i>
  </div>
  <div>
    <div class="kpi-val text-2xl font-black" style="color:${color}">${value}</div>
    <div class="${isDark ? 'text-zinc-400' : 'text-slate-500'} text-xs mt-0.5">${label}</div>
  </div>
</div>`).join('');

    return `
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
  ${cards}
</div>`;
  }

  // ─── Charts ───────────────────────────────────────────────────────────────

  private renderCharts(s: ReportSummary, isDark: boolean): string {
    const cardBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200';
    const textCol = isDark ? '#a1a1aa' : '#64748b';

    // Feature breakdown
    const featureMap = new Map<string, { passed: number; failed: number; skipped: number }>();
    for (const sc of s.scenarios) {
      const entry = featureMap.get(sc.featureName) ?? { passed: 0, failed: 0, skipped: 0 };
      if (sc.status === 'passed') entry.passed++;
      else if (sc.status === 'failed') entry.failed++;
      else entry.skipped++;
      featureMap.set(sc.featureName, entry);
    }

    const featureLabels = JSON.stringify([...featureMap.keys()]);
    const featurePassed  = JSON.stringify([...featureMap.values()].map((v) => v.passed));
    const featureFailed  = JSON.stringify([...featureMap.values()].map((v) => v.failed));
    const featureSkipped = JSON.stringify([...featureMap.values()].map((v) => v.skipped));

    return `
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
  <div class="${cardBg} border rounded-2xl p-6">
    <h3 class="font-semibold mb-4 text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}">
      <i class="bi bi-pie-chart mr-2 text-indigo-500"></i>Result Distribution
    </h3>
    <div class="flex items-center justify-center" style="height:220px">
      <canvas id="donutChart"></canvas>
    </div>
  </div>
  <div class="${cardBg} border rounded-2xl p-6">
    <h3 class="font-semibold mb-4 text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}">
      <i class="bi bi-bar-chart mr-2 text-indigo-500"></i>Results by Feature
    </h3>
    <div style="height:220px">
      <canvas id="barChart"></canvas>
    </div>
  </div>
</div>
<script>
  window.__chartData = {
    passed: ${s.passed}, failed: ${s.failed},
    skipped: ${s.skipped}, pending: ${s.pending},
    featureLabels: ${featureLabels},
    featurePassed: ${featurePassed},
    featureFailed: ${featureFailed},
    featureSkipped: ${featureSkipped},
    textColor: '${textCol}',
  };
</script>`;
  }

  // ─── Scenarios ────────────────────────────────────────────────────────────

  private renderScenarios(scenarios: readonly ScenarioResult[], isDark: boolean): string {
    const STATUS_CFG: Record<TestStatus, { icon: string; color: string; bg: string }> = {
      passed:  { icon: 'bi-check-circle-fill', color: '#22c55e', bg: '#22c55e18' },
      failed:  { icon: 'bi-x-circle-fill',     color: '#ef4444', bg: '#ef444418' },
      skipped: { icon: 'bi-skip-forward-fill', color: '#6b7280', bg: '#6b728018' },
      pending: { icon: 'bi-hourglass-split',   color: '#eab308', bg: '#eab30818' },
    };

    if (scenarios.length === 0) {
      return `<div class="text-center py-20 ${isDark ? 'text-zinc-500' : 'text-slate-400'}">
        <i class="bi bi-inbox text-5xl block mb-3"></i>No scenarios recorded.
      </div>`;
    }

    const cards = scenarios.map((sc, idx) => {
      const cfg = STATUS_CFG[sc.status];
      const dur = this.fmtDuration(sc.durationMs);
      const tags = sc.tags.map((t) =>
        `<span class="px-2 py-0.5 rounded-md text-xs font-mono ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}">${this.escape(t)}</span>`,
      ).join('');

      const steps = this.renderStepTable(sc.steps, isDark, STATUS_CFG);
      const cardBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200';

      return `
<div class="${cardBg} border rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-colors">
  <button onclick="toggleScenario(${idx})" class="w-full text-left p-4 flex items-center justify-between gap-4 group">
    <div class="flex items-center gap-3 min-w-0">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm" style="background:${cfg.bg};color:${cfg.color}">
        <i class="bi ${cfg.icon}"></i>
      </div>
      <div class="min-w-0">
        <div class="font-semibold text-sm truncate">${this.escape(sc.name)}</div>
        <div class="${isDark ? 'text-zinc-500' : 'text-slate-400'} text-xs truncate">${this.escape(sc.featureName)}</div>
      </div>
    </div>
    <div class="flex items-center gap-3 shrink-0">
      <div class="hidden sm:flex gap-1.5">${tags}</div>
      <span class="${isDark ? 'text-zinc-400' : 'text-slate-400'} text-xs font-mono">${dur}</span>
      <span class="text-sm font-bold" style="color:${cfg.color}">${sc.steps.length} steps</span>
      <i id="chev-${idx}" class="bi bi-chevron-right chevron ${isDark ? 'text-zinc-500' : 'text-slate-400'} text-sm"></i>
    </div>
  </button>
  <div id="scenario-body-${idx}" class="hidden">
    <div class="border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}">
      ${steps}
    </div>
  </div>
</div>`;
    });

    return `
<div class="mb-4 flex items-center justify-between">
  <h2 class="font-bold text-sm ${isDark ? 'text-zinc-300' : 'text-slate-600'}">
    <i class="bi bi-list-check mr-2 text-indigo-500"></i>${scenarios.length} Scenarios
  </h2>
</div>
<div class="flex flex-col gap-3">${cards.join('')}</div>`;
  }

  private renderStepTable(
    steps: readonly StepResult[],
    isDark: boolean,
    cfg: Record<TestStatus, { icon: string; color: string; bg: string }>,
  ): string {
    const rows = steps.map((step) => {
      const sc = cfg[step.status];
      const dur = this.fmtDuration(step.durationMs);
      const errorRow = step.error
        ? `<tr class="${isDark ? 'bg-red-950/30' : 'bg-red-50'}">
            <td colspan="3" class="px-4 py-2 text-xs font-mono text-red-400 whitespace-pre-wrap">${this.escape(step.error)}</td>
           </tr>`
        : '';
      const screenshotRow = step.screenshot
        ? `<tr><td colspan="3" class="px-4 py-2">
            <img src="${step.screenshot}" class="rounded-lg border ${isDark ? 'border-zinc-700' : 'border-slate-200'} max-w-sm shadow-md" alt="screenshot"/>
           </td></tr>`
        : '';

      return `
<tr class="border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}">
  <td class="px-4 py-2.5 w-8">
    <i class="bi ${sc.icon} text-sm" style="color:${sc.color}"></i>
  </td>
  <td class="px-4 py-2.5 text-xs font-mono ${isDark ? 'text-zinc-300' : 'text-slate-700'}">${this.escape(step.text)}</td>
  <td class="px-4 py-2.5 text-xs text-right font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'} whitespace-nowrap">${dur}</td>
</tr>
${errorRow}${screenshotRow}`;
    });

    return `
<table class="w-full text-sm">
  <thead>
    <tr class="${isDark ? 'bg-zinc-950/50' : 'bg-slate-50'}">
      <th class="px-4 py-2 text-left text-xs font-semibold ${isDark ? 'text-zinc-500' : 'text-slate-400'} uppercase tracking-wide w-8">St</th>
      <th class="px-4 py-2 text-left text-xs font-semibold ${isDark ? 'text-zinc-500' : 'text-slate-400'} uppercase tracking-wide">Description</th>
      <th class="px-4 py-2 text-right text-xs font-semibold ${isDark ? 'text-zinc-500' : 'text-slate-400'} uppercase tracking-wide">Duration</th>
    </tr>
  </thead>
  <tbody>${rows.join('')}</tbody>
</table>`;
  }

  // ─── Changelog Section ───────────────────────────────────────────────────

  private renderChangelog(s: ReportSummary, _isDark: boolean): string {
    const isDark = _isDark;
    const cardBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200';
    const KIND_COLOR: Record<string, string> = {
      feature: '#6366f1', fix: '#ef4444', refactor: '#8b5cf6',
      breaking: '#dc2626', docs: '#22c55e', perf: '#eab308',
    };

    if (s.changelog.length === 0) {
      return `<div class="text-center py-20 ${isDark ? 'text-zinc-500' : 'text-slate-400'}">
        <i class="bi bi-clock-history text-5xl block mb-3"></i>
        No changes recorded. Use <code class="font-mono text-sm">@AuraChange</code> to document changes.
      </div>`;
    }

    const rows = s.changelog.slice(0, 50).map((e) => {
      const color = KIND_COLOR[e.kind] ?? '#6366f1';
      const tags = e.tags.map((t) =>
        `<span class="px-1.5 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}">${this.escape(t)}</span>`,
      ).join(' ');

      return `
<tr class="border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'} hover:${isDark ? 'bg-zinc-800/30' : 'bg-slate-50'} transition-colors">
  <td class="px-4 py-3">
    <span class="px-2 py-1 rounded-md text-xs font-bold uppercase" style="background:${color}18;color:${color}">${e.kind}</span>
  </td>
  <td class="px-4 py-3">
    <div class="font-medium text-sm">${this.escape(e.title)}</div>
    <div class="${isDark ? 'text-zinc-500' : 'text-slate-400'} text-xs font-mono mt-0.5">${this.escape(e.target)}</div>
  </td>
  <td class="px-4 py-3 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'} max-w-xs">${this.escape(e.description)}</td>
  <td class="px-4 py-3 text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}">${e.version}</td>
  <td class="px-4 py-3 text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}">${e.author}</td>
  <td class="px-4 py-3 text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}">${e.date.slice(0, 10)}</td>
  <td class="px-4 py-3"><div class="flex gap-1 flex-wrap">${tags}</div></td>
</tr>`;
    });

    return `
<div class="${cardBg} border rounded-2xl overflow-hidden">
  <div class="px-6 py-4 ${isDark ? 'border-zinc-800' : 'border-slate-200'} border-b flex items-center justify-between">
    <h3 class="font-semibold text-sm">
      <i class="bi bi-clock-history mr-2 text-indigo-500"></i>Change History
    </h3>
    <span class="text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}">${s.changelog.length} records</span>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="${isDark ? 'bg-zinc-950/40' : 'bg-slate-50'}">
        <tr>
          ${['Type','Change','Description','Version','Author','Date','Tags'].map((h) =>
            `<th class="px-4 py-3 text-left text-xs font-semibold ${isDark ? 'text-zinc-500' : 'text-slate-400'} uppercase tracking-wide whitespace-nowrap">${h}</th>`
          ).join('')}
        </tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>
  </div>
</div>`;
  }

  // ─── Footer ───────────────────────────────────────────────────────────────

  private renderFooter(s: ReportSummary, version: string, isDark: boolean): string {
    return `
<footer class="${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-slate-200 text-slate-400'} border-t mt-8 py-4">
  <div class="container mx-auto px-4 max-w-7xl flex items-center justify-between flex-wrap gap-2 text-xs">
    <span>⚡ <strong>SAI</strong> v${version} · Applied AI Team</span>
    <span>${s.totalScenarios} scenarios · ${s.passed} passed · Generated: ${new Date(s.generatedAt).toLocaleString()}</span>
  </div>
</footer>`;
  }

  // ─── JS ───────────────────────────────────────────────────────────────────

  private renderScript(_s: ReportSummary): string {
    return `
<script>
// ── Tab switching ──
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.getElementById('btn-' + name).classList.add('active');
}

// ── Scenario toggle ──
function toggleScenario(idx) {
  const body = document.getElementById('scenario-body-' + idx);
  const chev = document.getElementById('chev-' + idx);
  const hidden = body.classList.toggle('hidden');
  chev.classList.toggle('open', !hidden);
}

// ── Theme toggle ──
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
}

// ── Charts ──
document.addEventListener('DOMContentLoaded', () => {
  const d = window.__chartData;
  if (!d) return;

  // Donut
  const donut = document.getElementById('donutChart');
  if (donut) {
    new Chart(donut, {
      type: 'doughnut',
      data: {
        labels: ['Passed','Failed','Skipped','Pending'],
        datasets: [{ data: [d.passed, d.failed, d.skipped, d.pending],
          backgroundColor: ['#22c55e','#ef4444','#6b7280','#eab308'],
          borderWidth: 0, hoverOffset: 4 }]
      },
      options: {
        cutout: '72%', responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: { position: 'right', labels: { color: d.textColor, padding: 12, usePointStyle: true } },
          tooltip: { callbacks: { label: ctx => ' ' + ctx.label + ': ' + ctx.parsed } }
        }
      }
    });
  }

  // Bar chart
  const bar = document.getElementById('barChart');
  if (bar && d.featureLabels.length > 0) {
    new Chart(bar, {
      type: 'bar',
      data: {
        labels: d.featureLabels,
        datasets: [
          { label: 'Passed', data: d.featurePassed, backgroundColor: '#22c55e99', borderRadius: 4 },
          { label: 'Failed', data: d.featureFailed, backgroundColor: '#ef444499', borderRadius: 4 },
          { label: 'Skipped', data: d.featureSkipped, backgroundColor: '#6b728099', borderRadius: 4 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { stacked: true, ticks: { color: d.textColor, font: { size: 11 } }, grid: { display: false } },
          y: { stacked: true, ticks: { color: d.textColor }, grid: { color: d.textColor + '22' } }
        },
        plugins: { legend: { labels: { color: d.textColor, usePointStyle: true } } }
      }
    });
  }
});
</script>`;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private escape(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  private fmtDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  }
}

// ─── Cucumber JSON Shape ──────────────────────────────────────────────────────

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

// CLI: ts-node src/core/reporting/TailwindReportEngine.ts
if (require.main === module) {
  const input  = process.env['AURA_REPORT_INPUT']  ?? 'reports/cucumber-report.json';
  const output = process.env['AURA_REPORT_OUTPUT'] ?? 'reports';
  const title  = process.env['AURA_REPORT_TITLE']  ?? 'SAI Test Report';
  const theme  = (process.env['AURA_REPORT_THEME'] ?? 'dark') as 'dark' | 'light';

  new TailwindReportEngine(input, output, title, theme)
    .generate()
    .then(() => console.log('[AURA/Report] Done.'))
    .catch(console.error);
}
