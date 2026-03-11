/**
 * AURA — HTML Dashboard
 * Generates a self-contained, zero-dependency HTML/CSS dashboard
 * inspired by Linear and Vercel design systems.
 *
 * Features:
 *  - Dark / Light mode
 *  - Pass-rate donut chart (pure SVG)
 *  - Collapsible scenario cards with step details
 *  - Embedded screenshots
 *  - Inline ChangeLog panel
 *  - No external CDN dependencies — 100% self-contained
 */
import type { ReportSummary, ScenarioResult, StepResult, ChangeEntry } from '../../types/index';

export class HTMLDashboard {
  constructor(private readonly theme: 'dark' | 'light' = 'dark') {}

  render(summary: ReportSummary): string {
    const css = this.buildCSS();
    const js = this.buildJS();
    return `<!DOCTYPE html>
<html lang="en" data-theme="${this.theme}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${this.escape(summary.title)}</title>
  <style>${css}</style>
</head>
<body>
  ${this.buildHeader(summary)}
  ${this.buildMetrics(summary)}
  ${this.buildScenarios(summary.scenarios)}
  ${this.buildChangelog(summary.changelog)}
  <script>${js}</script>
</body>
</html>`;
  }

  // ─── Header ───────────────────────────────────────────────────────────────

  private buildHeader(s: ReportSummary): string {
    const date = new Date(s.generatedAt).toLocaleString();
    const duration = this.formatDuration(s.durationMs);
    const statusClass = s.failed > 0 ? 'status-failed' : 'status-passed';
    const statusText = s.failed > 0 ? '✗ FAILED' : '✓ PASSED';

    return `
<header class="header">
  <div class="header-inner">
    <div class="header-brand">
      <span class="logo">⚡ AURA</span>
      <span class="header-sub">Test Report</span>
    </div>
    <div class="header-meta">
      <span class="badge ${statusClass}">${statusText}</span>
      <span class="meta-item">🕒 ${duration}</span>
      <span class="meta-item">📅 ${date}</span>
    </div>
  </div>
  <h1 class="report-title">${this.escape(s.title)}</h1>
</header>`;
  }

  // ─── Metrics ──────────────────────────────────────────────────────────────

  private buildMetrics(s: ReportSummary): string {
    const donut = this.buildDonut(s.passRate);
    return `
<section class="metrics">
  <div class="metrics-grid">
    <div class="metric-card metric-total">
      <div class="metric-value">${s.totalScenarios}</div>
      <div class="metric-label">Total</div>
    </div>
    <div class="metric-card metric-passed">
      <div class="metric-value">${s.passed}</div>
      <div class="metric-label">Passed</div>
    </div>
    <div class="metric-card metric-failed">
      <div class="metric-value">${s.failed}</div>
      <div class="metric-label">Failed</div>
    </div>
    <div class="metric-card metric-skipped">
      <div class="metric-value">${s.skipped + s.pending}</div>
      <div class="metric-label">Skipped</div>
    </div>
    <div class="metric-card donut-card">
      ${donut}
      <div class="metric-label">Pass Rate</div>
    </div>
  </div>
</section>`;
  }

  private buildDonut(passRate: number): string {
    const r = 40;
    const cx = 56, cy = 56;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (passRate / 100) * circumference;
    const color = passRate >= 80 ? '#22c55e' : passRate >= 50 ? '#eab308' : '#ef4444';

    return `
<svg class="donut" viewBox="0 0 112 112" width="112" height="112">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2a2a2a" stroke-width="12"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="12"
    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
    stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
    fill="${color}" font-size="18" font-weight="700">${passRate}%</text>
</svg>`;
  }

  // ─── Scenarios ────────────────────────────────────────────────────────────

  private buildScenarios(scenarios: readonly ScenarioResult[]): string {
    const cards = scenarios.map((s) => this.buildScenarioCard(s)).join('');
    return `
<section class="scenarios">
  <h2 class="section-title">Scenarios <span class="count">${scenarios.length}</span></h2>
  <div class="scenario-list">${cards}</div>
</section>`;
  }

  private buildScenarioCard(s: ScenarioResult): string {
    const statusIcon = { passed: '✓', failed: '✗', skipped: '○', pending: '◌' }[s.status];
    const duration = this.formatDuration(s.durationMs);
    const tags = s.tags.map((t) => `<span class="tag">${this.escape(t)}</span>`).join('');
    const steps = s.steps.map((step) => this.buildStepRow(step)).join('');

    return `
<div class="scenario-card status-${s.status}">
  <div class="scenario-header" onclick="toggleScenario(this)">
    <div class="scenario-left">
      <span class="status-icon status-${s.status}">${statusIcon}</span>
      <div class="scenario-info">
        <div class="scenario-name">${this.escape(s.name)}</div>
        <div class="scenario-feature">${this.escape(s.featureName)}</div>
      </div>
    </div>
    <div class="scenario-right">
      <div class="scenario-tags">${tags}</div>
      <span class="duration">${duration}</span>
      <span class="chevron">›</span>
    </div>
  </div>
  <div class="scenario-body hidden">
    <table class="steps-table">
      <thead><tr><th>Status</th><th>Step</th><th>Duration</th></tr></thead>
      <tbody>${steps}</tbody>
    </table>
  </div>
</div>`;
  }

  private buildStepRow(step: StepResult): string {
    const icons = { passed: '✓', failed: '✗', skipped: '○', pending: '◌' };
    const icon = icons[step.status];
    const errorHTML = step.error
      ? `<div class="step-error">${this.escape(step.error)}</div>`
      : '';
    const screenshotHTML = step.screenshot
      ? `<div class="step-screenshot"><img src="${step.screenshot}" alt="screenshot"/></div>`
      : '';

    return `
<tr class="step-row step-${step.status}">
  <td><span class="step-icon status-${step.status}">${icon}</span></td>
  <td>
    <div class="step-text">${this.escape(step.text)}</div>
    ${errorHTML}${screenshotHTML}
  </td>
  <td class="step-duration">${this.formatDuration(step.durationMs)}</td>
</tr>`;
  }

  // ─── Changelog Panel ──────────────────────────────────────────────────────

  private buildChangelog(entries: readonly ChangeEntry[]): string {
    if (entries.length === 0) return '';

    const rows = entries
      .slice(0, 20)
      .map(
        (e) => `
<tr>
  <td><span class="badge badge-${e.kind}">${e.kind}</span></td>
  <td><strong>${this.escape(e.title)}</strong><br/><small class="muted">${this.escape(e.target)}</small></td>
  <td class="muted">${e.version}</td>
  <td class="muted">${e.date.slice(0, 10)}</td>
</tr>`,
      )
      .join('');

    return `
<section class="changelog">
  <h2 class="section-title">ChangeLog <span class="count">${entries.length}</span></h2>
  <table class="changelog-table">
    <thead><tr><th>Type</th><th>Change</th><th>Version</th><th>Date</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</section>`;
  }

  // ─── CSS ──────────────────────────────────────────────────────────────────

  private buildCSS(): string {
    return `
:root {
  --bg: #0a0a0a; --surface: #111; --surface2: #1a1a1a; --border: #222;
  --text: #e8e8e8; --muted: #666; --accent: #5b6ad0;
  --passed: #22c55e; --failed: #ef4444; --skipped: #6b7280; --pending: #eab308;
  --radius: 8px; --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --mono: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
}
[data-theme="light"] {
  --bg: #f8f8f8; --surface: #fff; --surface2: #f0f0f0; --border: #e0e0e0;
  --text: #111; --muted: #888; --accent: #4f5ec0;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--text); font-family: var(--font); font-size: 14px; line-height: 1.6; }
.header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 1.25rem 2rem; }
.header-inner { display: flex; justify-content: space-between; align-items: center; margin-bottom: .5rem; }
.logo { font-size: 1.2rem; font-weight: 800; letter-spacing: -.02em; color: #fff; }
[data-theme="light"] .logo { color: #111; }
.header-sub { color: var(--muted); margin-left: .5rem; font-size: .85rem; }
.header-meta { display: flex; align-items: center; gap: 1rem; }
.meta-item { color: var(--muted); font-size: .82rem; }
.report-title { font-size: 1.5rem; font-weight: 700; color: var(--text); }
.metrics { padding: 2rem; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; max-width: 900px; }
.metric-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; text-align: center; }
.metric-value { font-size: 2rem; font-weight: 800; }
.metric-label { color: var(--muted); font-size: .78rem; text-transform: uppercase; letter-spacing: .08em; margin-top: .25rem; }
.metric-passed .metric-value { color: var(--passed); }
.metric-failed .metric-value { color: var(--failed); }
.metric-skipped .metric-value { color: var(--skipped); }
.donut-card { display: flex; flex-direction: column; align-items: center; gap: .25rem; }
.donut { display: block; }
.scenarios, .changelog { padding: 0 2rem 2rem; }
.section-title { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin-bottom: 1rem; }
.count { background: var(--surface2); color: var(--muted); padding: .1rem .4rem; border-radius: 4px; font-size: .78rem; font-weight: 400; }
.scenario-list { display: flex; flex-direction: column; gap: .5rem; }
.scenario-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: border-color .15s; }
.scenario-card:hover { border-color: var(--accent); }
.scenario-card.status-failed { border-left: 3px solid var(--failed); }
.scenario-card.status-passed { border-left: 3px solid var(--passed); }
.scenario-card.status-skipped { border-left: 3px solid var(--skipped); }
.scenario-header { display: flex; justify-content: space-between; align-items: center; padding: .9rem 1.25rem; cursor: pointer; user-select: none; }
.scenario-left { display: flex; align-items: center; gap: .75rem; }
.scenario-right { display: flex; align-items: center; gap: 1rem; }
.scenario-name { font-weight: 600; font-size: .95rem; }
.scenario-feature { color: var(--muted); font-size: .78rem; }
.scenario-tags { display: flex; gap: .35rem; flex-wrap: wrap; }
.tag { background: var(--surface2); color: var(--muted); padding: .1rem .4rem; border-radius: 4px; font-size: .72rem; font-family: var(--mono); }
.duration { color: var(--muted); font-size: .82rem; font-family: var(--mono); }
.chevron { color: var(--muted); font-size: 1.2rem; transition: transform .2s; }
.scenario-header.open .chevron { transform: rotate(90deg); }
.scenario-body { padding: 0 1.25rem 1.25rem; }
.scenario-body.hidden { display: none; }
.steps-table { width: 100%; border-collapse: collapse; font-size: .87rem; }
.steps-table th { color: var(--muted); font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; padding: .4rem .75rem; text-align: left; border-bottom: 1px solid var(--border); }
.steps-table td { padding: .5rem .75rem; border-bottom: 1px solid var(--border); vertical-align: top; }
.step-text { font-family: var(--mono); font-size: .82rem; }
.step-error { color: var(--failed); font-size: .8rem; margin-top: .3rem; white-space: pre-wrap; font-family: var(--mono); }
.step-screenshot img { margin-top: .5rem; max-width: 320px; border-radius: 4px; border: 1px solid var(--border); }
.step-duration { color: var(--muted); font-family: var(--mono); font-size: .78rem; white-space: nowrap; }
.status-icon { font-weight: 700; }
.status-passed { color: var(--passed); }
.status-failed { color: var(--failed); }
.status-skipped, .status-pending { color: var(--skipped); }
.badge { display: inline-flex; align-items: center; padding: .2rem .55rem; border-radius: 4px; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
.status-passed.badge { background: rgba(34,197,94,.15); color: var(--passed); }
.status-failed.badge { background: rgba(239,68,68,.15); color: var(--failed); }
.badge-feature { background: rgba(91,106,208,.2); color: #7d8ef0; }
.badge-fix { background: rgba(239,100,68,.2); color: #f0856d; }
.badge-refactor { background: rgba(138,91,208,.2); color: #c08af0; }
.badge-breaking { background: rgba(239,68,68,.2); color: var(--failed); }
.badge-docs { background: rgba(34,197,94,.2); color: var(--passed); }
.badge-perf { background: rgba(234,179,8,.2); color: var(--pending); }
.changelog-table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.changelog-table th { background: var(--surface2); color: var(--muted); font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; padding: .6rem 1rem; text-align: left; }
.changelog-table td { padding: .65rem 1rem; border-bottom: 1px solid var(--border); font-size: .87rem; vertical-align: top; }
.muted { color: var(--muted); }
small.muted { font-size: .78rem; }
`;
  }

  // ─── JS ───────────────────────────────────────────────────────────────────

  private buildJS(): string {
    return `
function toggleScenario(header) {
  const body = header.nextElementSibling;
  const isOpen = !body.classList.contains('hidden');
  body.classList.toggle('hidden', isOpen);
  header.classList.toggle('open', !isOpen);
}`;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const m = Math.floor(ms / 60000);
    const s = Math.round((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  }
}
