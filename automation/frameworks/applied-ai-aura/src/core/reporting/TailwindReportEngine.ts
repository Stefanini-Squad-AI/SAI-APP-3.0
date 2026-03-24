/**
 * AURA — Tailwind Report Engine (v3 — full-featured)
 *
 * Generates self-contained HTML reports matching the original AURA report format:
 *  - 7 tabs: Executive Summary, Overall Results, Test Results, Step Details,
 *    Success Logs, Error Logs, Video
 *  - Full i18n (ES/EN/PT) with language switcher
 *  - Dark / Grey theme toggle
 *  - AI-generated executive summary via Perplexity / configurable LLM
 *  - Embedded base64 screenshots per step
 *  - Chart.js donut + bar + coverage charts
 *  - Searchable log tables
 *  - Screenshot zoom modal
 *  - 100% self-contained HTML (TailwindCSS CDN + Chart.js CDN + Bootstrap Icons)
 *
 * Data sources:
 *  - cucumber-report.json (feature/scenario structure)
 *  - aura-scenarios.jsonl  (rich per-scenario data: logs, screenshots, intents)
 */
import * as fs from 'fs';
import * as path from 'path';
import type {
  ReportSummary,
  ScenarioResult,
  StepResult,
  StepId,
  TestStatus,
} from '../../types/index';
import { ChangelogRegistry } from '../changelog/ChangelogRegistry';
import { parseReportThemeEnv } from './ReportTheme';
import { buildFeatureSuiteStats } from './reportFeatureStats';
import type { AuraReportData, AuraLogEntry } from './AuraReportCollector';

// ─── Report File Naming ───────────────────────────────────────────────────────

export function buildReportFileName(testName: string, version?: string): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
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
    .map((f) => { const m = /v(\d+\.\d+\.\d+)\.html$/.exec(f); return m ? m[1] : null; })
    .filter((v): v is string => v !== null);
  if (existing.length === 0) return '1.0.0';
  const latest = existing.sort((a, b) => {
    const [ma, mi, pa] = a.split('.').map(Number);
    const [mb, mi2, pb] = b.split('.').map(Number);
    return (mb - ma) || (mi2 - mi) || (pb - pa);
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
    private readonly theme: 'dark' | 'grey' = parseReportThemeEnv(process.env['AURA_REPORT_THEME']),
  ) {}

  async generate(): Promise<{ htmlPath: string; jsonPath: string; summary: ReportSummary }> {
    const features = this.loadCucumberJSON();
    const scenarios = this.parseScenarios(features);
    const scenarioDataList = this.loadScenarioJSONL();
    const summary = this.buildSummary(scenarios);

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const { htmlPath, jsonPath, version } = this.resolveOutputPaths();

    let executiveSummaries: { en: string; es: string; pt: string } = { en: '', es: '', pt: '' };
    try {
      executiveSummaries = await this.generateExecutiveSummary(summary, scenarioDataList);
    } catch (err) {
      console.warn('[AURA/Report] Could not generate AI summary:', (err as Error).message);
    }

    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
    fs.writeFileSync(htmlPath, this.renderFullHTML(summary, version, scenarioDataList, executiveSummaries));

    console.log(`[AURA/Report] ✓ JSON  → ${jsonPath}`);
    console.log(`[AURA/Report] ✓ HTML  → ${htmlPath}`);

    return { htmlPath, jsonPath, summary };
  }

  private resolveOutputPaths(): { htmlPath: string; jsonPath: string; version: string } {
    const fixed = process.env['AURA_REPORT_FILENAME']?.trim();
    if (fixed) {
      const htmlName = fixed.endsWith('.html') ? fixed : `${fixed}.html`;
      const base = path.basename(htmlName, '.html');
      return {
        htmlPath: path.join(this.outputDir, htmlName),
        jsonPath: path.join(this.outputDir, `${base}.json`),
        version: process.env['AURA_REPORT_VERSION'] ?? '1.0.0',
      };
    }
    const testName = this.reportTitle.replace(/\s+/g, '_');
    const version = resolveVersion(this.outputDir, testName);
    const fileName = buildReportFileName(testName, version);
    return {
      htmlPath: path.join(this.outputDir, fileName),
      jsonPath: path.join(this.outputDir, fileName.replace('.html', '.json')),
      version,
    };
  }

  // ─── Data Loading ──────────────────────────────────────────────────────────

  private loadCucumberJSON(): CucumberFeature[] {
    if (!fs.existsSync(this.inputPath)) return [];
    return JSON.parse(fs.readFileSync(this.inputPath, 'utf-8')) as CucumberFeature[];
  }

  private loadScenarioJSONL(): AuraReportData[] {
    const jsonlPath = path.join(this.outputDir, 'aura-scenarios.jsonl');
    if (!fs.existsSync(jsonlPath)) return [];
    return fs.readFileSync(jsonlPath, 'utf-8')
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => { try { return JSON.parse(line) as AuraReportData; } catch { return null; } })
      .filter((d): d is AuraReportData => d !== null);
  }

  // ─── Parsing ───────────────────────────────────────────────────────────────

  private parseScenarios(features: CucumberFeature[]): ScenarioResult[] {
    const results: ScenarioResult[] = [];
    for (const feature of features) {
      for (const scenario of feature.elements ?? []) {
        const steps = this.parseSteps(scenario.steps ?? []);
        const durationMs = steps.reduce((s, st) => s + st.durationMs, 0);
        const hasFailure = steps.some((s) => s.status === 'failed');
        const hasPending = steps.some((s) => s.status === 'pending');
        const allSkipped = steps.every((s) => s.status === 'skipped');
        const status: TestStatus = hasFailure ? 'failed' : hasPending ? 'pending' : allSkipped ? 'skipped' : 'passed';
        const startedAt = scenario.start_timestamp ?? new Date().toISOString();
        results.push({
          id: scenario.id,
          name: scenario.name,
          featureName: feature.name,
          tags: (scenario.tags ?? []).map((t) => t.name),
          status, durationMs, steps, startedAt,
          finishedAt: new Date(new Date(startedAt).getTime() + durationMs).toISOString(),
        });
      }
    }
    return results;
  }

  private parseSteps(raw: CucumberStep[]): StepResult[] {
    return raw
      .filter((step) => !step.hidden)
      .map((step, idx): StepResult => {
        const status = this.mapStatus(step.result?.status ?? 'skipped');
        const durationMs = Math.round((step.result?.duration ?? 0) / 1_000_000);
        const screenshot = (step.embeddings ?? []).find((e) => e.mime_type.startsWith('image/'))?.data;
        return {
          id: `step-${idx}` as StepId,
          text: step.name ?? step.keyword?.trim() ?? `Step ${idx + 1}`,
          status, durationMs,
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
    const { totalFeatures, featureStats } = buildFeatureSuiteStats(scenarios);
    return {
      title: this.reportTitle,
      generatedAt: new Date().toISOString(),
      totalFeatures, totalScenarios: total,
      passed, failed, skipped, pending, durationMs,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      scenarios, featureStats,
      changelog: ChangelogRegistry.getInstance().getAll(),
    };
  }

  // ─── AI Executive Summary ──────────────────────────────────────────────────

  private resolveExecSummaryMaxTokens(): number {
    const raw = process.env['AURA_EXEC_SUMMARY_MAX_TOKENS']?.trim();
    const n = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(n) && n >= 1024 && n <= 32000) return n;
    return 8192;
  }

  private async generateExecutiveSummary(
    summary: ReportSummary,
    scenarioDataList: AuraReportData[],
  ): Promise<{ en: string; es: string; pt: string }> {
    const { createLLMAdapter } = await import('../cognitive/LLMAdapterFactory');
    const adapter = createLLMAdapter();
    const maxTok = this.resolveExecSummaryMaxTokens();

    const stepsDetail = scenarioDataList.length > 0
      ? scenarioDataList.map((sd) =>
          `Feature: ${sd.featureName}\nScenario: ${sd.scenarioName} [${sd.status}]\n` +
          (sd.successLogs?.length ? `Success log lines: ${sd.successLogs.length}\n` : '') +
          (sd.errorLogs?.length ? `Error log lines: ${sd.errorLogs.length}\n` : '') +
          sd.steps.map((s) => `  ${s.stepNumber}. [${s.status.toUpperCase()}] ${s.keyword} ${s.text} (${s.durationMs}ms)${s.error ? ' — Error: ' + s.error : ''}`).join('\n'),
        ).join('\n\n')
      : summary.scenarios.map((sc) =>
          `Feature: ${sc.featureName}\nScenario: ${sc.name} [${sc.status}]\n` +
          sc.steps.map((s, i) => `  ${i + 1}. [${s.status.toUpperCase()}] ${s.text} (${s.durationMs}ms)${s.error ? ' — Error: ' + s.error : ''}`).join('\n'),
        ).join('\n\n');

    const errDigest = scenarioDataList.flatMap((sd) => sd.errorLogs ?? []).slice(0, 40)
      .map((e) => (typeof e.message === 'string' ? e.message : JSON.stringify(e))).join('\n');
    const tagSet = [...new Set(summary.scenarios.flatMap((s) => s.tags ?? []))];
    const changelogBrief = summary.changelog?.length
      ? summary.changelog.slice(0, 8).map((c) => `${c.version}: ${c.title} — ${c.description}`).join(' | ')
      : '';

    const systemPrompt = `You are a senior QA / test automation lead writing a structured EXECUTIVE FUNCTIONAL TEST REPORT (Cucumber / browser automation) for business and engineering stakeholders.
You MUST use the LLM output only as Markdown (no HTML). For EACH language, follow the SAME outline and depth.

Style and audience:
- Explain at a high level in clear, professional prose. Readers may not be deeply technical: define acronyms once, avoid jargon dumps, connect results to user-facing risk and quality.
- Be substantive: each section should add real insight from the data (not filler).
- Do NOT use emojis, decorative symbols, or numeric reference markers like [1] or [12].
- Do NOT include fenced code blocks (\`\`\`), inline code snippets, file paths in backticks, or pasted JSON.
- Use ## for the 10 main sections. Under "Hallazgos" / "Findings" / "Achados" use exactly these three ### subsections.
- Use short bullet lists where helpful (- item).
- Avoid raw code, CSS selectors, and full stack traces; paraphrase error themes.
- Historical trend: this payload is usually a single run. Say explicitly when no prior runs exist; if changelog hints are present, relate them cautiously.
- Glossary: 4–8 plain-language terms used in THIS report (Feature, Scenario, Gherkin step, pass rate, etc.) in the target language.

Return ONLY valid JSON with this exact schema (no markdown fences):
{"en":"<markdown string>","es":"<markdown string>","pt":"<markdown string>"}

**es** — use EXACTLY these headings (no leading icons or extra characters):
## Encabezado de Contexto
## Resultado General (Semáforo)
## Alcance — ¿Qué se probó?
## Hallazgos Detallados
### Lo que funcionó
### Fallos encontrados
### Advertencias
## Métricas de Rendimiento
## Evaluación de Riesgos
## Cobertura de Pruebas
## Recomendaciones Accionables
## Tendencia Histórica
## Glosario de Términos

**en** — same structure with natural English titles:
## Context Header
## Overall Result (Traffic Light)
## Scope — What Was Tested?
## Detailed Findings
### What Worked
### Failures Found
### Warnings
## Performance Metrics
## Risk Assessment
## Test Coverage
## Actionable Recommendations
## Historical Trend
## Glossary of Terms

**pt** — same structure in Portuguese:
## Cabeçalho de Contexto
## Resultado Geral (Semáforo)
## Escopo — O que foi testado?
## Achados Detalhados
### O que funcionou
### Falhas encontradas
### Avisos
## Métricas de Desempenho
## Avaliação de Riscos
## Cobertura de Testes
## Recomendações Acionáveis
## Tendência Histórica
## Glossário de Termos`;

    const first = scenarioDataList[0];
    const browserLine = first
      ? `${first.browserInfo.name}${first.browserInfo.headless ? ' (headless)' : ''} · ${first.browserInfo.viewport}`
      : (process.env['AURA_BROWSER'] ?? 'chromium');

    const userPrompt = `Analyze the following automated test run and fill the structured executive report in es/en/pt.

=== Aggregated metrics ===
Report title: ${summary.title}
Features (tests): ${summary.totalFeatures}
Scenarios (test cases): ${summary.totalScenarios}
Scenarios passed/failed/skipped/pending: ${summary.passed} / ${summary.failed} / ${summary.skipped} / ${summary.pending}
Scenario pass rate: ${summary.passRate}%
Total duration (sum of scenarios): ${(summary.durationMs / 1000).toFixed(1)}s
Generated at (ISO): ${summary.generatedAt}
Browser / viewport: ${browserLine}
Tags observed: ${tagSet.length ? tagSet.join(', ') : '(none)'}
${changelogBrief ? `Changelog hints (may be empty): ${changelogBrief}\n` : ''}
=== Per-scenario detail ===
${stepsDetail}

=== Error / failure digest (trimmed) ===
${errDigest || '(no error log lines collected)'}

=== Instruction ===
${summary.failed > 0 ? 'There were failures: prioritize risk, root-cause themes, and remediation.' : 'All scenarios passed: still document residual risks and monitoring suggestions.'}`;

    console.info(`[AURA/Report] Generating structured executive summaries with AI (maxTokens=${maxTok})...`);
    const response = await adapter.complete({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.35,
      maxTokens: maxTok,
    });

    const parsed = this.parseSummaryJson(response.content);
    if (parsed) {
      console.info(`[AURA/Report] ✓ AI summaries generated (${response.tokensUsed} tokens, ${response.latencyMs}ms)`);
      return this.sanitizeExecutiveSummaryByLang(parsed);
    }
    console.warn('[AURA/Report] AI summary JSON invalid, using raw content.');
    return this.sanitizeExecutiveSummaryByLang({
      en: response.content.trim(),
      es: response.content.trim(),
      pt: response.content.trim(),
    });
  }

  private sanitizeExecutiveMarkdown(md: string): string {
    if (!md) return '';
    let s = md.replace(/\[\d+\]/g, '');
    s = s.replace(/```[\s\S]*?```/g, '');
    s = s.replace(/\p{Extended_Pictographic}/gu, '');
    s = s.replace(/\n{3,}/g, '\n\n').trim();
    return s;
  }

  private sanitizeExecutiveSummaryByLang(obj: { en: string; es: string; pt: string }): {
    en: string;
    es: string;
    pt: string;
  } {
    return {
      en: this.sanitizeExecutiveMarkdown(obj.en),
      es: this.sanitizeExecutiveMarkdown(obj.es),
      pt: this.sanitizeExecutiveMarkdown(obj.pt),
    };
  }

  private parseSummaryJson(raw: string): { en: string; es: string; pt: string } | null {
    const tryParse = (s: string): { en: string; es: string; pt: string } | null => {
      try {
        const p = JSON.parse(s.trim()) as Record<string, unknown>;
        const en = typeof p.en === 'string' ? p.en.trim() : '';
        const es = typeof p.es === 'string' ? p.es.trim() : '';
        const pt = typeof p.pt === 'string' ? p.pt.trim() : '';
        if (!en && !es && !pt) return null;
        return { en: en || es || pt, es: es || en || pt, pt: pt || en || es };
      } catch { return null; }
    };
    const direct = tryParse(raw);
    if (direct) return direct;
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return fenced?.[1] ? tryParse(fenced[1]) : null;
  }

  // ─── Screenshot Embedding ──────────────────────────────────────────────────

  private embedScreenshot(relPath: string | undefined): string {
    if (!relPath) return '';
    const absPath = path.join(this.outputDir, relPath);
    if (!fs.existsSync(absPath)) return '';
    try {
      const buf = fs.readFileSync(absPath);
      return `data:image/png;base64,${buf.toString('base64')}`;
    } catch { return ''; }
  }

  // ─── Full HTML Rendering ───────────────────────────────────────────────────

  private renderFullHTML(
    summary: ReportSummary,
    version: string,
    scenarioDataList: AuraReportData[],
    execSummary: { en: string; es: string; pt: string },
  ): string {
    const grey = this.theme === 'grey';
    const d = this.buildTemplateData(summary, scenarioDataList);
    const summaryHtml = {
      en: execSummary.en ? this.mdHtml(execSummary.en) : '',
      es: execSummary.es ? this.mdHtml(execSummary.es) : '',
      pt: execSummary.pt ? this.mdHtml(execSummary.pt) : '',
    };
    const summaryHtmlJson = JSON.stringify(summaryHtml).replace(/<\/script/g, '<\\/script');
    const dataJson = JSON.stringify(d).replace(/<\/script/g, '<\\/script');

    return `<!DOCTYPE html>
<html lang="es" data-theme="${grey ? 'grey' : 'dark'}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(this.reportTitle)}</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"><\/script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<script>tailwind.config={darkMode:'class',theme:{extend:{colors:{aura:{50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81',950:'#1e1b4b'}}}}};<\/script>
<style>
.tab-btn.active{border-color:#6366f1;color:#a5b4fc;background:rgba(99,102,241,.1)}
.tab-panel{display:none}.tab-panel.active{display:block}
.screenshot-thumb{cursor:pointer;transition:transform .2s,box-shadow .2s}
.screenshot-thumb:hover{transform:scale(1.03);box-shadow:0 8px 25px rgba(99,102,241,.3)}
#modal-overlay{display:none}#modal-overlay.open{display:flex}
.log-row:nth-child(even){background:rgba(255,255,255,.02)}
.acc-body{max-height:0;overflow:hidden;transition:max-height .3s ease}
.acc-body.open{max-height:99999px}
.acc-chevron{transition:transform .2s}.acc-chevron.open{transform:rotate(90deg)}
.search-input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:.5rem;padding:.5rem .75rem;color:#e5e7eb;font-size:.75rem;width:100%}
.search-input:focus{outline:none;border-color:#6366f1}
/* Grey mode: mid-slate (más contraste que slate-100, sin llegar a dark) */
html[data-theme="grey"] body{background:#cbd5e1!important;color:#0f172a!important}
html[data-theme="grey"] header.bg-gray-900{background:linear-gradient(to right,#4338ca,#312e81)!important;border-color:#312e81!important}
html[data-theme="grey"] nav.bg-gray-900\\/50{background:#94a3b8!important;border-color:#64748b!important}
html[data-theme="grey"] .bg-gray-950{background:#cbd5e1!important}
html[data-theme="grey"] main .bg-gray-900,html[data-theme="grey"] footer.border-gray-800{border-color:#64748b!important}
html[data-theme="grey"] main .bg-gray-900,html[data-theme="grey"] main .bg-gray-800\\/30{background:#e2e8f0!important;box-shadow:0 2px 8px rgba(15,23,42,.08)!important}
html[data-theme="grey"] main .border-gray-800,html[data-theme="grey"] main .border-gray-700\\/50,html[data-theme="grey"] main .divide-gray-800\\/50>*{border-color:#94a3b8!important}
html[data-theme="grey"] main .text-white,html[data-theme="grey"] footer .text-gray-400{color:#0f172a!important}
html[data-theme="grey"] main .text-gray-200,html[data-theme="grey"] main .text-gray-300,html[data-theme="grey"] main .text-gray-400,html[data-theme="grey"] main .text-gray-500{color:#334155!important}
html[data-theme="grey"] main .text-aura-300,html[data-theme="grey"] main .text-aura-400{color:#3730a3!important}
html[data-theme="grey"] .log-row:nth-child(even){background:#d8dee9!important}
html[data-theme="grey"] .search-input{background:#e2e8f0!important;border:1px solid #64748b!important;color:#0f172a!important}
html[data-theme="grey"] .tab-btn.active{border-color:#4f46e5!important;color:#312e81!important;background:rgba(79,70,229,.18)!important}
html[data-theme="grey"] .tab-btn:not(.active){color:#475569!important}
html[data-theme="grey"] .tab-btn:not(.active):hover{color:#0f172a!important}
html[data-theme="grey"] main .prose,html[data-theme="grey"] main .prose p,html[data-theme="grey"] #executive-summary-content p,html[data-theme="grey"] #executive-summary-content li{color:#1e293b!important}
html[data-theme="grey"] main .prose strong,html[data-theme="grey"] #executive-summary-content strong{color:#0f172a!important}
html[data-theme="grey"] #executive-summary-content h2{border-color:#94a3b8!important}
html[data-theme="grey"] thead.bg-gray-800\\/50,html[data-theme="grey"] thead.bg-gray-950\\/40{background:#94a3b8!important}
html[data-theme="grey"] tbody tr{border-color:#94a3b8!important}
</style>
</head>
<body class="bg-gray-950 text-gray-200 min-h-screen font-sans">

<!-- HEADER -->
<header class="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
<div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
  <div class="flex items-center gap-3">
    <div class="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white text-[10px] tracking-tight">SAI</div>
    <div>
      <h1 class="text-lg font-bold text-white leading-tight">${esc(this.reportTitle)}</h1>
      <p class="text-xs text-white/70">${d.totalFeatures} feature(s) · ${d.totalScenarios} scenario(s) · v${esc(version)}</p>
    </div>
  </div>
  <div class="flex items-center gap-4">
    <span class="px-3 py-1 rounded-full text-xs font-bold ${d.overallStatus === 'PASSED' ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/50' : 'bg-red-500/20 text-red-100 border border-red-400/50'}">${d.overallStatus}</span>
    <button onclick="toggleTheme()" class="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-lg transition" title="Dark / Grey">
      <i class="bi bi-circle-half"></i>
    </button>
    <select id="lang-select" onchange="switchLang(this.value)" class="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5">
      <option value="es">🇪🇸 Español</option><option value="en">🇺🇸 English</option><option value="pt">🇧🇷 Português</option>
    </select>
  </div>
</div>
</header>

<!-- TABS -->
<nav class="bg-gray-900/50 border-b border-gray-800 overflow-x-auto">
<div class="max-w-7xl mx-auto px-4 flex gap-1">
  ${tabBtn('executive', 'bi-file-earmark-text', 'tabExecutive', 'Resumen Ejecutivo', true)}
  ${tabBtn('overall', 'bi-graph-up', 'tabOverall', 'Resultados Generales')}
  ${tabBtn('results', 'bi-list-check', 'tabResults', 'Resultados de Pruebas')}
  ${tabBtn('steps', 'bi-layers', 'tabSteps', 'Detalle de Pasos')}
  ${tabBtn('success', 'bi-check-circle', 'tabSuccess', 'Logs de Éxito')}
  ${tabBtn('errors', 'bi-exclamation-triangle', 'tabErrors', 'Logs de Error')}
  ${tabBtn('video', 'bi-camera-video', 'tabVideo', 'Video')}
</div>
</nav>

<main class="max-w-7xl mx-auto px-4 py-6 space-y-6">

<!-- TAB: EXECUTIVE SUMMARY -->
<section id="tab-executive" class="tab-panel active">
<div class="bg-gray-900 rounded-xl border border-gray-800 p-6">
  <div class="mb-4">
    <h2 class="text-xl font-bold text-white" data-i18n="executiveTitle">Resumen Ejecutivo</h2>
    <p class="text-xs text-gray-400 mt-1" data-i18n="executiveSubtitle">Resumen de pruebas funcionales con AI</p>
  </div>
  <div id="executive-summary-content" class="prose max-w-none text-slate-700 leading-relaxed">
    ${summaryHtml.es || '<p class="text-gray-500 italic" data-i18n="noSummary">Resumen ejecutivo no disponible.</p>'}
  </div>
</div>
</section>

<!-- TAB: OVERALL RESULTS -->
<section id="tab-overall" class="tab-panel">
  <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-6">
    <div class="px-6 py-4 border-b border-gray-800">
      <h3 class="font-semibold text-sm text-gray-200" data-i18n="suiteComposition">Suite composition</h3>
      <p class="text-xs text-gray-500 mt-1">${d.totalFeatures} <span data-i18n="suiteFeatWord">feature(s) (test)</span> · ${d.totalScenarios} <span data-i18n="suiteScenWord">scenario(s)</span> — <span data-i18n="suiteOneReport">one report for this run.</span></p>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-950/40">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide" data-i18n="colFeatureTest">Feature (test)</th>
            <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide" data-i18n="covScenarios">Scenarios</th>
            <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide" data-i18n="suiteColPassed">Passed</th>
            <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide" data-i18n="suiteColFailed">Failed</th>
            <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide" data-i18n="suiteColSkip">Skip/Pend</th>
          </tr>
        </thead>
        <tbody>
${d.suiteRows.map((row) => `          <tr class="border-t border-gray-800">
            <td class="px-4 py-2.5 text-gray-200 font-medium">${esc(row.featureName)}</td>
            <td class="px-4 py-2.5 text-right font-mono text-gray-300">${row.scenarios}</td>
            <td class="px-4 py-2.5 text-right font-mono text-emerald-400">${row.passed}</td>
            <td class="px-4 py-2.5 text-right font-mono text-red-400">${row.failed}</td>
            <td class="px-4 py-2.5 text-right font-mono text-gray-400">${row.skipPend}</td>
          </tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
    ${kpiCard('bi-folder2', 'kpiFeatures', 'Features (tests)', d.totalFeatures, 'blue')}
    ${kpiCard('bi-collection', 'kpiScenarios', 'Scenarios', d.totalScenarios, 'aura')}
    ${kpiCard('bi-check-circle-fill', 'kpiScenPassed', 'Passed', d.scenarioPassed, 'emerald')}
    ${kpiCard('bi-x-circle-fill', 'kpiScenFailed', 'Failed', d.scenarioFailed, 'red')}
    ${kpiCard('bi-skip-forward', 'kpiScenSkipped', 'Skipped', d.scenarioSkipped + d.scenarioPending, 'gray')}
    ${kpiCard('bi-speedometer2', 'kpiRate', 'Pass Rate', d.scenarioPassRate + '%', 'emerald')}
  </div>

  <div class="grid md:grid-cols-2 gap-6 mb-6">
    <div class="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h3 class="text-sm font-semibold text-gray-400 mb-4" data-i18n="chartResults">Result Distribution</h3>
      <div class="flex justify-center"><canvas id="chart-donut" width="280" height="280"></canvas></div>
      <div class="flex flex-wrap justify-center gap-3 mt-4 text-[10px]">
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span><span data-i18n="lgPassing">Exitosos</span></span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-red-500"></span><span data-i18n="lgFailed">Fallidos</span></span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span><span data-i18n="lgPending">Pendientes</span></span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-gray-500"></span><span data-i18n="lgSkipped">Omitidos</span></span>
      </div>
    </div>
    <div class="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h3 class="text-sm font-semibold text-gray-400 mb-4" data-i18n="chartByFeature">Results by Feature</h3>
      <div style="height:280px"><canvas id="chart-bar"></canvas></div>
    </div>
  </div>

  <div class="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
    <h3 class="text-sm font-semibold text-gray-400 mb-4" data-i18n="chartDuration">Duración por Paso (ms)</h3>
    <div style="height:220px"><canvas id="chart-step-durations"></canvas></div>
  </div>

  <div class="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
    <h3 class="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2"><i class="bi bi-clipboard-data"></i><span data-i18n="keyStats">Estadísticas Clave</span></h3>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      ${statCard('bi-folder2', 'ksFeatures', 'Features', d.totalFeatures)}
      ${statCard('bi-collection', 'ksScenarios', 'Escenarios', d.totalScenarios)}
      ${statCard('bi-list-task', 'ksTestCases', 'Casos de Prueba', d.totalScenarios)}
      ${statCard('bi-list-ol', 'ksTotalSteps', 'Pasos Gherkin', d.totalSteps)}
      ${statCard('bi-play-circle', 'ksStarted', 'Inicio de Pruebas', d.startTime)}
      ${statCard('bi-stop-circle', 'ksFinished', 'Fin de Pruebas', d.endTime)}
      ${statCard('bi-hourglass-split', 'ksTotalDuration', 'Duración Total', fmtDur(d.durationMs))}
      ${statCard('bi-lightning', 'ksFastest', 'Paso más rápido', fmtDur(d.fastest))}
      ${statCard('bi-hourglass-bottom', 'ksSlowest', 'Paso más lento', fmtDur(d.slowest))}
    </div>
  </div>

  <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-6">
    <div class="p-4 border-b border-gray-800"><h3 class="text-sm font-semibold text-gray-400 flex items-center gap-2"><i class="bi bi-table"></i><span data-i18n="covDetails">Detalle de Cobertura Funcional</span></h3></div>
    <table class="w-full text-xs">
      <thead class="bg-gray-800/50"><tr>
        <th class="px-4 py-2 text-left text-gray-400" data-i18n="covFeature">Feature</th>
        <th class="px-4 py-2 text-center text-gray-400" data-i18n="covScenarios">Escenarios</th>
        <th class="px-4 py-2 text-center text-gray-400" data-i18n="covTestCases">Casos de prueba</th>
        <th class="px-4 py-2 text-center text-gray-400" data-i18n="covSteps">Pasos</th>
        <th class="px-4 py-2 text-center text-gray-400" data-i18n="covPassRate">% Éxito</th>
        <th class="px-4 py-2 text-center text-gray-400" data-i18n="covResult">Resultado</th>
        <th class="px-4 py-2 text-left text-gray-400" data-i18n="covCoverage">Cobertura</th>
      </tr></thead>
      <tbody>
${d.features.map((f) => `        <tr class="border-t border-gray-800/50 hover:bg-gray-800/20">
          <td class="px-4 py-3 text-aura-300">${esc(f.name)}</td>
          <td class="px-4 py-3 text-center text-gray-300">${f.scenarioCount}</td>
          <td class="px-4 py-3 text-center text-gray-300">${f.scenarioCount}</td>
          <td class="px-4 py-3 text-center text-gray-300">${f.totalSteps}</td>
          <td class="px-4 py-3 text-center font-bold ${f.passRate === 100 ? 'text-emerald-400' : 'text-red-400'}">${f.passRate}%</td>
          <td class="px-4 py-3 text-center">${f.passRate === 100 ? '<i class="bi bi-check-circle-fill text-emerald-400"></i>' : '<i class="bi bi-x-circle-fill text-red-400"></i>'}</td>
          <td class="px-4 py-3"><div class="w-full bg-gray-800 rounded-full h-2.5"><div class="h-2.5 rounded-full ${f.passRate === 100 ? 'bg-emerald-500' : 'bg-red-500'}" style="width:${f.passRate}%"></div></div></td>
        </tr>`).join('\n')}
      </tbody>
    </table>
  </div>

  <div class="bg-gray-900 rounded-xl border border-gray-800 p-6">
    <h3 class="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2"><i class="bi bi-bug"></i><span data-i18n="failOverview">Resumen de Fallos</span></h3>
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <p class="text-xs font-semibold text-gray-300 mb-2" data-i18n="failFrequent">Fallos Más Frecuentes</p>
        ${d.failedSteps > 0 ? d.failedStepDetails.map((s) => `<div class="bg-red-950/20 border border-red-900/30 rounded-lg p-3 mb-2"><p class="text-xs text-red-300">${esc(s.keyword)} ${esc(s.text)}</p><p class="text-[10px] text-red-400/70 mt-1">${esc(s.error ?? '')}</p></div>`).join('') : '<p class="text-xs text-gray-600" data-i18n="noFailures">No se registraron fallos.</p>'}
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-300 mb-2" data-i18n="failUnstable">Features Más Inestables</p>
        ${d.unstableFeatures.length > 0 ? d.unstableFeatures.map((f) => `<div class="bg-red-950/20 border border-red-900/30 rounded-lg p-3 mb-2"><p class="text-xs text-red-300">${esc(f.name)}</p><p class="text-[10px] text-red-400/70 mt-1">${f.failedScenarios} escenario(s) fallido(s)</p></div>`).join('') : '<p class="text-xs text-gray-600" data-i18n="noUnstable">No hay features inestables.</p>'}
      </div>
    </div>
  </div>

  <div class="grid md:grid-cols-3 gap-4 mt-6">
    <div class="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <p class="text-xs text-gray-500 mb-1" data-i18n="infoScenario">Escenario</p>
      <p class="text-sm text-white font-medium">${d.totalScenarios} <span data-i18n="ksScenarios">escenario(s)</span></p>
      <p class="text-xs text-gray-400 mt-1">${d.allTags.map((t) => `<span class="inline-block bg-aura-900/40 text-aura-300 px-2 py-0.5 rounded text-[10px] mr-1 mb-1">${esc(t)}</span>`).join('')}</p>
    </div>
    <div class="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <p class="text-xs text-gray-500 mb-1" data-i18n="infoEnvironment">Entorno</p>
      <p class="text-sm text-white"><span data-i18n="envBrowser">Navegador</span>: <span class="text-gray-300">${esc(d.browserName)}</span></p>
      <p class="text-sm text-white">Headless: <span class="text-gray-300">${d.headless ? 'Sí' : 'No'}</span></p>
      <p class="text-sm text-white">Viewport: <span class="text-gray-300">${esc(d.viewport)}</span></p>
    </div>
    <div class="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <p class="text-xs text-gray-500 mb-1" data-i18n="infoTester">Ejecutor</p>
      <p class="text-sm text-white">${esc(d.testerName)}</p>
      <p class="text-xs text-gray-400">${esc(d.testerEmail)}</p>
      <p class="text-xs text-gray-500 mt-1">${d.startTime}</p>
    </div>
  </div>
</section>

<!-- TAB: TEST RESULTS -->
<section id="tab-results" class="tab-panel">
  <div class="space-y-3">
${d.scenarioBlocks.map((sc) => `    <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <button onclick="toggleAcc(this)" class="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors border-b border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg ${sc.status === 'passed' ? 'bg-emerald-900/30' : 'bg-red-900/30'} flex items-center justify-center">
            <i class="bi ${sc.status === 'passed' ? 'bi-check-lg text-emerald-400' : 'bi-x-lg text-red-400'} text-lg"></i>
          </div>
          <div class="text-left">
            <p class="text-sm text-white font-semibold">${esc(sc.name)}</p>
            <p class="text-xs text-gray-500">${esc(sc.featureName)} · ${sc.tags.map((t) => `<span class="text-aura-400">${esc(t)}</span>`).join(' ')}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          ${badge(sc.status)}
          <span class="text-xs text-gray-500 font-mono">${fmtDur(sc.durationMs)}</span>
          <i class="bi bi-chevron-right acc-chevron text-gray-500"></i>
        </div>
      </button>
      <div class="acc-body">
        <table class="w-full text-sm">
          <thead class="bg-gray-800/50"><tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400" data-i18n="colStep">#</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400" data-i18n="colDescription">Descripción</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400" data-i18n="colStatus">Estado</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400" data-i18n="colDuration">Duración</th>
          </tr></thead>
          <tbody class="divide-y divide-gray-800/50">
            ${sc.steps.map((s, i) => `<tr class="hover:bg-gray-800/30 transition-colors"><td class="px-4 py-3 text-gray-400 font-mono text-xs">${i + 1}</td><td class="px-4 py-3"><span class="text-aura-400 font-medium">${esc(s.keyword)}</span> ${esc(s.text)}</td><td class="px-4 py-3">${badge(s.status)}</td><td class="px-4 py-3 text-xs text-gray-400 font-mono">${s.durationMs}ms</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`).join('\n')}
  </div>
</section>

<!-- TAB: STEP DETAILS -->
<section id="tab-steps" class="tab-panel">
  <div class="space-y-3">
${d.scenarioBlocks.map((sc) => `    <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <button onclick="toggleAcc(this)" class="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors border-b border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg ${sc.status === 'passed' ? 'bg-emerald-900/30' : 'bg-red-900/30'} flex items-center justify-center">
            <i class="bi ${sc.status === 'passed' ? 'bi-check-lg text-emerald-400' : 'bi-x-lg text-red-400'} text-lg"></i>
          </div>
          <div class="text-left">
            <p class="text-sm text-white font-semibold">${esc(sc.name)}</p>
            <p class="text-xs text-gray-500">${sc.passedSteps}/${sc.totalSteps} <span data-i18n="stepsLabel">pasos exitosos</span> · ${fmtDur(sc.durationMs)}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          ${badge(sc.status)}
          <i class="bi bi-chevron-right acc-chevron text-gray-500"></i>
        </div>
      </button>
      <div class="acc-body">
        <div class="p-4 space-y-3">
          ${sc.steps.map((s) => this.renderStepCard(s, sc)).join('')}
        </div>
      </div>
    </div>`).join('\n')}
  </div>
</section>

<!-- TAB: SUCCESS LOGS -->
<section id="tab-success" class="tab-panel">
  ${this.renderLogTable(d.successLogs, 'emerald', 'successEmpty', 'No se registraron logs de éxito.', 'successCount', 'Logs de Éxito')}
</section>

<!-- TAB: ERROR LOGS -->
<section id="tab-errors" class="tab-panel">
  ${this.renderLogTable(d.errorLogs, 'red', 'errorEmpty', 'No se registraron errores. ¡Excelente!', 'errorCount', 'Logs de Error')}
</section>

<!-- TAB: VIDEO -->
<section id="tab-video" class="tab-panel">
<div class="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-8">
  ${d.videos.length > 0
    ? d.videos.map((v) => `
  <div>
    <p class="text-sm font-medium text-gray-300 mb-2"><i class="bi bi-film me-2 text-aura-400"></i>${esc(v.label)}</p>
    <video controls class="w-full max-w-4xl mx-auto rounded-lg border border-gray-700 bg-black" preload="metadata" style="width:100%;height:auto;max-height:70vh;object-fit:contain;display:block"><source src="${esc(v.path)}" type="video/webm"></video>
  </div>`).join('')
    : `<div class="text-center py-16"><i class="bi bi-camera-video-off text-5xl text-gray-700 mb-4 block"></i><p class="text-gray-500" data-i18n="noVideo">No se grabó video para esta ejecución.</p><p class="text-xs text-gray-600 mt-2" data-i18n="noVideoHint">Configura AURA_RECORD_VIDEO=true en .env para habilitar grabación.</p></div>`}
</div>
</section>

</main>

<!-- FOOTER -->
<footer class="border-t border-gray-800 mt-8 py-6 text-center text-xs text-gray-500">
  <p class="font-medium text-gray-400" data-i18n="footerMadeBy">Hecho por Applied AI Team</p>
  <p class="mt-1"><span data-i18n="generatedAt">Generado</span> ${d.endTime} · v${esc(version)}</p>
</footer>

<!-- MODAL -->
<div id="modal-overlay" class="fixed inset-0 bg-black/80 z-50 items-center justify-center p-4" onclick="closeModal()">
  <img id="modal-img" src="" alt="Screenshot" class="max-w-full max-h-[90vh] rounded-lg shadow-2xl">
</div>

<!-- SCRIPTS -->
<script>
const R=${dataJson};
const SUMMARY_HTML=${summaryHtmlJson};

document.querySelectorAll('.tab-btn').forEach(b=>{b.addEventListener('click',()=>{document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById('tab-'+b.dataset.tab).classList.add('active')})});

function openModal(s){document.getElementById('modal-img').src=s;document.getElementById('modal-overlay').classList.add('open')}
function closeModal(){document.getElementById('modal-overlay').classList.remove('open')}
function toggleAcc(btn){const body=btn.nextElementSibling;body.classList.toggle('open');btn.querySelector('.acc-chevron').classList.toggle('open')}
function toggleStep(btn){const body=btn.nextElementSibling;body.classList.toggle('hidden');btn.querySelector('.step-chev')?.classList.toggle('rotate-90')}
function filterLogs(input,tableId){const q=input.value.toLowerCase();document.querySelectorAll('#'+tableId+' tbody tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q)?'':'none'})}

function toggleTheme(){
  const h=document.documentElement;
  var t=h.getAttribute('data-theme')||'dark';
  h.setAttribute('data-theme',t==='dark'?'grey':'dark');
}

const donutCtx=document.getElementById('chart-donut');
if(donutCtx){new Chart(donutCtx,{type:'doughnut',data:{labels:['Passed','Failed','Pending','Skipped'],datasets:[{data:[R.scenarioPassed||0,R.scenarioFailed||0,R.scenarioPending||0,R.scenarioSkipped||0],backgroundColor:['#10b981','#ef4444','#f59e0b','#6b7280'],borderWidth:0,borderRadius:4}]},options:{responsive:false,cutout:'65%',plugins:{legend:{display:false}}}})}

const barCtx=document.getElementById('chart-bar');
if(barCtx&&R.features&&R.features.length){new Chart(barCtx,{type:'bar',data:{labels:R.features.map(function(f){return f.name}),datasets:[{label:'Passed',data:R.features.map(function(f){return f.passedScenarios}),backgroundColor:'#22c55e',borderRadius:4},{label:'Failed',data:R.features.map(function(f){return f.failedScenarios}),backgroundColor:'#ef4444',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#9ca3af'}}},scales:{x:{stacked:true,ticks:{color:'#6b7280',maxRotation:45,minRotation:0},grid:{display:false}},y:{stacked:true,beginAtZero:true,ticks:{color:'#6b7280',stepSize:1},grid:{color:'rgba(255,255,255,.05)'}}}}})}

const stepDurCtx=document.getElementById('chart-step-durations');
if(stepDurCtx&&R.allStepDurations&&R.allStepDurations.length){new Chart(stepDurCtx,{type:'bar',data:{labels:R.allStepDurations.map(function(_,i){return 'Step '+(i+1)}),datasets:[{label:'ms',data:R.allStepDurations,backgroundColor:R.allStepStatuses.map(function(s){return s==='passed'?'#6366f1':'#ef4444'}),borderRadius:6,barThickness:Math.min(28,Math.max(8,600/R.allStepDurations.length))}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#6b7280',maxRotation:45},grid:{display:false}},y:{ticks:{color:'#6b7280'},grid:{color:'rgba(255,255,255,.05)'}}}}})}

const i18n={
es:{reportTitle:'Reporte de Pruebas SAI',footerMadeBy:'Hecho por Applied AI Team',tabExecutive:'Resumen Ejecutivo',tabOverall:'Resultados Generales',tabResults:'Resultados de Pruebas',tabSteps:'Detalle de Pasos',tabSuccess:'Logs de Éxito',tabErrors:'Logs de Error',tabVideo:'Video',executiveTitle:'Resumen Ejecutivo',executiveSubtitle:'Resumen de pruebas funcionales con AI',noSummary:'Resumen ejecutivo no disponible.',suiteComposition:'Composición de suite',suiteFeatWord:'feature(s) (test)',suiteScenWord:'escenario(s)',suiteOneReport:'un solo informe para esta ejecución.',colFeatureTest:'Feature (test)',suiteColPassed:'Passed',suiteColFailed:'Failed',suiteColSkip:'Skip/Pend',kpiFeatures:'Features (tests)',kpiScenPassed:'Aprobados',kpiScenFailed:'Fallidos',kpiScenSkipped:'Omitidos / pend.',chartByFeature:'Resultados por feature',chartResults:'Distribución de resultados',kpiTotal:'Total',kpiPassed:'Exitosos',kpiFailed:'Fallidos',kpiRate:'Tasa de Éxito',kpiDuration:'Duración',chartDuration:'Duración por paso (ms)',covSteps:'Pasos',ksTotalSteps:'Pasos Gherkin',lgPassing:'Exitosos',lgFailed:'Fallidos',lgPending:'Pendientes',lgSkipped:'Omitidos',keyStats:'Estadísticas Clave',ksFeatures:'Features',ksScenarios:'Escenarios',ksTestCases:'Casos de Prueba',ksStarted:'Inicio de Pruebas',ksFinished:'Fin de Pruebas',ksTotalDuration:'Duración Total',ksFastest:'Prueba Más Rápida',ksSlowest:'Prueba Más Lenta',ksAverage:'Tiempo Promedio',covOverview:'Cobertura Funcional',covDetails:'Detalle de Cobertura Funcional',covFeature:'Feature',covScenarios:'Escenarios',covTestCases:'Casos de prueba',covPassRate:'% Éxito',covResult:'Resultado',covCoverage:'Cobertura',failOverview:'Resumen de Fallos',failFrequent:'Fallos Más Frecuentes',failUnstable:'Features Más Inestables',noFailures:'No se registraron fallos.',noUnstable:'No hay features inestables.',infoScenario:'Escenario',infoEnvironment:'Entorno',infoTester:'Ejecutor',envBrowser:'Navegador',colStep:'#',colDescription:'Descripción',colStatus:'Estado',colDuration:'Duración',stepsLabel:'pasos exitosos',screenshot:'Captura de Pantalla',stepLogs:'Logs del Paso',successEmpty:'No se registraron logs de éxito.',errorEmpty:'No se registraron errores. ¡Excelente!',noVideo:'No se grabó video para esta ejecución.',noVideoHint:'Configura AURA_RECORD_VIDEO=true en .env para habilitar grabación.',generatedAt:'Generado',colTimestamp:'Hora',colElement:'Elemento',colAction:'Acción',colMessage:'Mensaje',colDetails:'Detalles',logTotal:'Total',logLogs:'logs',searchLogs:'Buscar logs...',successCount:'Logs de Éxito',errorCount:'Logs de Error'},
en:{reportTitle:'SAI Test Report',footerMadeBy:'Made by Applied AI Team',tabExecutive:'Executive Summary',tabOverall:'Overall Results',tabResults:'Test Results',tabSteps:'Steps Details',tabSuccess:'Success Logs',tabErrors:'Error Logs',tabVideo:'Video',executiveTitle:'Executive Summary',executiveSubtitle:'Functional test summary with AI',noSummary:'Executive summary not available.',suiteComposition:'Suite composition',suiteFeatWord:'feature(s) (test)',suiteScenWord:'scenario(s)',suiteOneReport:'one report for this run.',colFeatureTest:'Feature (test)',suiteColPassed:'Passed',suiteColFailed:'Failed',suiteColSkip:'Skip/Pend',kpiFeatures:'Features (tests)',kpiScenPassed:'Passed',kpiScenFailed:'Failed',kpiScenSkipped:'Skipped',chartByFeature:'Results by Feature',chartResults:'Result distribution',kpiTotal:'Total',kpiPassed:'Passed',kpiFailed:'Failed',kpiRate:'Success Rate',kpiDuration:'Duration',chartDuration:'Duration per step (ms)',covSteps:'Steps',ksTotalSteps:'Gherkin steps',lgPassing:'Passing',lgFailed:'Failed',lgPending:'Pending',lgSkipped:'Skipped',keyStats:'Key Statistics',ksFeatures:'Features',ksScenarios:'Scenarios',ksTestCases:'Test Cases',ksStarted:'Tests Started',ksFinished:'Tests Finished',ksTotalDuration:'Total Duration',ksFastest:'Fastest Test',ksSlowest:'Slowest Test',ksAverage:'Average Time',covOverview:'Functional Coverage',covDetails:'Functional Coverage Details',covFeature:'Feature',covScenarios:'Scenarios',covTestCases:'Test Cases',covPassRate:'% Pass',covResult:'Result',covCoverage:'Coverage',failOverview:'Failure Overview',failFrequent:'Most Frequent Failures',failUnstable:'Most Unstable Features',noFailures:'No failures recorded.',noUnstable:'No unstable features.',infoScenario:'Scenario',infoEnvironment:'Environment',infoTester:'Tester',envBrowser:'Browser',colStep:'#',colDescription:'Description',colStatus:'Status',colDuration:'Duration',stepsLabel:'steps passed',screenshot:'Screenshot',stepLogs:'Step Logs',successEmpty:'No success logs recorded.',errorEmpty:'No errors recorded. Excellent!',noVideo:'No video recorded.',noVideoHint:'Set AURA_RECORD_VIDEO=true in .env to enable.',generatedAt:'Generated',colTimestamp:'Time',colElement:'Element',colAction:'Action',colMessage:'Message',colDetails:'Details',logTotal:'Total',logLogs:'logs',searchLogs:'Search logs...',successCount:'Success Logs',errorCount:'Error Logs'},
pt:{reportTitle:'Relatório de Testes SAI',footerMadeBy:'Feito por Applied AI Team',tabExecutive:'Resumo Executivo',tabOverall:'Resultados Gerais',tabResults:'Resultados dos Testes',tabSteps:'Detalhes dos Passos',tabSuccess:'Logs de Sucesso',tabErrors:'Logs de Erro',tabVideo:'Vídeo',executiveTitle:'Resumo Executivo',executiveSubtitle:'Resumo de testes funcionais com IA',noSummary:'Resumo executivo não disponível.',suiteComposition:'Composição da suite',suiteFeatWord:'feature(s) (test)',suiteScenWord:'cenário(s)',suiteOneReport:'um único relatório para esta execução.',colFeatureTest:'Feature (test)',suiteColPassed:'Passed',suiteColFailed:'Failed',suiteColSkip:'Skip/Pend',kpiFeatures:'Features (tests)',kpiScenPassed:'Aprovados',kpiScenFailed:'Falhos',kpiScenSkipped:'Omitidos / pend.',chartByFeature:'Resultados por feature',chartResults:'Distribuição de resultados',kpiTotal:'Total',kpiPassed:'Aprovados',kpiFailed:'Falhos',kpiRate:'Taxa de Sucesso',kpiDuration:'Duração',chartDuration:'Duração por passo (ms)',covSteps:'Passos',ksTotalSteps:'Passos Gherkin',lgPassing:'Aprovados',lgFailed:'Falhos',lgPending:'Pendentes',lgSkipped:'Omitidos',keyStats:'Estatísticas Principais',ksFeatures:'Features',ksScenarios:'Cenários',ksTestCases:'Casos de Teste',ksStarted:'Início dos Testes',ksFinished:'Fim dos Testes',ksTotalDuration:'Duração Total',ksFastest:'Teste Mais Rápido',ksSlowest:'Teste Mais Lento',ksAverage:'Tempo Médio',covOverview:'Cobertura Funcional',covDetails:'Detalhes de Cobertura',covFeature:'Feature',covScenarios:'Cenários',covTestCases:'Casos',covPassRate:'% Sucesso',covResult:'Resultado',covCoverage:'Cobertura',failOverview:'Visão Geral de Falhas',failFrequent:'Falhas Frequentes',failUnstable:'Features Instáveis',noFailures:'Nenhuma falha registrada.',noUnstable:'Nenhuma feature instável.',infoScenario:'Cenário',infoEnvironment:'Ambiente',infoTester:'Executor',envBrowser:'Navegador',colStep:'#',colDescription:'Descrição',colStatus:'Status',colDuration:'Duração',stepsLabel:'passos aprovados',screenshot:'Captura de Tela',stepLogs:'Logs do Passo',successEmpty:'Nenhum log de sucesso.',errorEmpty:'Nenhum erro. Excelente!',noVideo:'Nenhum vídeo gravado.',noVideoHint:'Configure AURA_RECORD_VIDEO=true em .env.',generatedAt:'Gerado',colTimestamp:'Hora',colElement:'Elemento',colAction:'Ação',colMessage:'Mensagem',colDetails:'Detalhes',logTotal:'Total',logLogs:'logs',searchLogs:'Buscar logs...',successCount:'Logs de Sucesso',errorCount:'Logs de Erro'}
};
function renderExecutiveSummary(lang){
  const c=document.getElementById('executive-summary-content');
  if(!c)return;
  const html=SUMMARY_HTML[lang]||SUMMARY_HTML.en||'';
  if(html&&html.trim()){c.innerHTML=html}
  else{const t=i18n[lang]||i18n.es;c.innerHTML='<p class="text-gray-500 italic">'+(t.noSummary||'N/A')+'</p>'}
}
function switchLang(l){
  const t=i18n[l]||i18n.es;
  document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.getAttribute('data-i18n');if(t[k])el.textContent=t[k]});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const k=el.getAttribute('data-i18n-placeholder');if(t[k])el.placeholder=t[k]});
  document.documentElement.lang=l;
  renderExecutiveSummary(l);
}
switchLang(document.getElementById('lang-select')?.value||'es');
<\/script>
</body></html>`;
  }

  // ─── Step Card (for Step Details tab) ──────────────────────────────────────

  private renderStepCard(
    step: TemplateStep,
    _scenario: TemplateScenario,
  ): string {
    const cls = step.status === 'passed' ? 'bg-emerald-900/40 text-emerald-400'
      : step.status === 'failed' ? 'bg-red-900/40 text-red-400'
      : 'bg-gray-800 text-gray-400';

    const screenshotHtml = step.screenshotBase64
      ? `<div><p class="text-xs text-gray-500 mb-2" data-i18n="screenshot">Captura de Pantalla</p><img src="${step.screenshotBase64}" alt="Step ${step.stepNumber}" class="screenshot-thumb max-w-xl rounded-lg border border-gray-700" onclick="openModal(this.src)"></div>`
      : '';

    const errorHtml = step.error
      ? `<div class="bg-red-950/30 border border-red-900/50 rounded-lg p-3"><p class="text-xs text-red-400 font-mono break-all">${esc(step.error)}</p></div>`
      : '';

    const logsHtml = step.logs.length > 0
      ? `<div><p class="text-xs text-gray-500 mb-2" data-i18n="stepLogs">Logs del Paso</p><div class="space-y-1 text-xs font-mono">${step.logs.map((l) => {
          const color = l.level === 'SUCCESS' ? 'text-emerald-400' : l.level === 'ERROR' ? 'text-red-400' : l.level === 'WARNING' ? 'text-amber-400' : 'text-gray-400';
          return `<div class="log-row px-2 py-1 rounded ${color}">[${this.timeFromISO(l.timestamp)}] ${l.element ? '<span class="text-aura-300">' + esc(l.element) + '</span> · ' : ''}${l.action ? '<span class="text-gray-300">' + esc(l.action) + '</span> · ' : ''}${esc(l.message)}${l.details ? ' — <span class="text-gray-500">' + esc(l.details) + '</span>' : ''}</div>`;
        }).join('')}</div></div>`
      : '';

    return `<div class="bg-gray-800/30 rounded-xl border border-gray-800 overflow-hidden">
<button onclick="toggleStep(this)" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
  <div class="flex items-center gap-3">
    <span class="w-7 h-7 rounded-lg ${cls} flex items-center justify-center font-bold text-xs">${step.stepNumber}</span>
    <div class="text-left">
      <p class="text-sm text-white"><span class="text-aura-400 font-semibold">${esc(step.keyword)}</span> ${esc(step.text)}</p>
      <p class="text-xs text-gray-500">${step.durationMs}ms</p>
    </div>
  </div>
  <div class="flex items-center gap-2">${badge(step.status)}<i class="bi bi-chevron-right step-chev text-gray-500 transition-transform duration-200"></i></div>
</button>
<div class="hidden border-t border-gray-700/50">
  <div class="p-4 space-y-4">
    ${errorHtml}
    ${screenshotHtml}
    ${logsHtml}
  </div>
</div></div>`;
  }

  // ─── Log Table ─────────────────────────────────────────────────────────────

  private renderLogTable(
    logs: AuraLogEntry[],
    color: string,
    emptyKey: string,
    emptyText: string,
    countKey: string,
    title: string,
  ): string {
    if (logs.length === 0) {
      return `<div class="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center"><i class="bi ${color === 'emerald' ? 'bi-check-circle' : 'bi-shield-check'} text-4xl text-gray-700 mb-3 block"></i><p class="text-gray-500" data-i18n="${emptyKey}">${emptyText}</p></div>`;
    }
    const tableId = `log-table-${color}`;
    return `<div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
<div class="p-4 border-b border-gray-800 flex items-center justify-between">
  <div class="flex items-center gap-2"><i class="bi ${color === 'emerald' ? 'bi-check-circle' : 'bi-exclamation-triangle'} text-${color}-400"></i><h3 class="text-sm font-semibold text-gray-300" data-i18n="${countKey}">${title}</h3><span class="text-xs text-gray-500"><span data-i18n="logTotal">Total</span>: ${logs.length} <span data-i18n="logLogs">logs</span></span></div>
  <input type="text" class="search-input max-w-xs" placeholder="Buscar logs..." data-i18n-placeholder="searchLogs" oninput="filterLogs(this,'${tableId}')">
</div>
<table id="${tableId}" class="w-full text-xs">
  <thead class="bg-gray-800/50"><tr>
    <th class="px-4 py-2 text-left text-gray-400 whitespace-nowrap" data-i18n="colTimestamp">Hora</th>
    <th class="px-4 py-2 text-left text-gray-400" data-i18n="colElement">Elemento</th>
    <th class="px-4 py-2 text-left text-gray-400" data-i18n="colAction">Acción</th>
    <th class="px-4 py-2 text-left text-gray-400" data-i18n="colMessage">Mensaje</th>
    <th class="px-4 py-2 text-left text-gray-400" data-i18n="colDetails">Detalles</th>
  </tr></thead>
  <tbody class="divide-y divide-gray-800/50">
    ${logs.map((l) => `<tr class="log-row hover:bg-gray-800/20"><td class="px-4 py-2 text-gray-500 font-mono whitespace-nowrap">${this.timeFromISO(l.timestamp)}</td><td class="px-4 py-2 text-gray-300">${l.element ? esc(l.element) : '—'}</td><td class="px-4 py-2 text-gray-400">${l.action ? esc(l.action) : '—'}</td><td class="px-4 py-2 text-${color}-300">${esc(l.message)}</td><td class="px-4 py-2 text-gray-500 max-w-xs truncate">${l.details ? esc(l.details) : '—'}</td></tr>`).join('')}
  </tbody>
</table></div>`;
  }

  // ─── Template Data Builder ─────────────────────────────────────────────────

  private buildTemplateData(
    summary: ReportSummary,
    scenarioDataList: AuraReportData[],
  ): TemplateData {
    const scenarioMap = new Map<string, AuraReportData>();
    for (const sd of scenarioDataList) scenarioMap.set(sd.scenarioName, sd);

    const allStepDurations: number[] = [];
    const allStepStatuses: string[] = [];
    const allSuccessLogs: AuraLogEntry[] = [];
    const allErrorLogs: AuraLogEntry[] = [];
    const failedStepDetails: Array<{ keyword: string; text: string; error?: string }> = [];
    const videos: Array<{ path: string; label: string }> = [];
    for (const sd of scenarioDataList) {
      if (sd.videoRelPath) {
        videos.push({ path: sd.videoRelPath, label: sd.scenarioName });
      }
    }
    let totalSteps = 0;
    let passedSteps = 0;
    let failedStepsCount = 0;
    let skippedSteps = 0;

    const scenarioBlocks: TemplateScenario[] = summary.scenarios.map((sc): TemplateScenario => {
      const rich = scenarioMap.get(sc.name);
      const steps: TemplateStep[] = rich
        ? rich.steps.map((s) => {
            totalSteps++;
            if (s.status === 'passed') passedSteps++;
            else if (s.status === 'failed') { failedStepsCount++; failedStepDetails.push({ keyword: s.keyword, text: s.text, error: s.error }); }
            else skippedSteps++;
            allStepDurations.push(s.durationMs);
            allStepStatuses.push(s.status);
            return {
              stepNumber: s.stepNumber,
              keyword: s.keyword,
              text: s.text,
              status: s.status,
              durationMs: s.durationMs,
              error: s.error,
              screenshotBase64: this.embedScreenshot(s.screenshotPath),
              logs: s.logs,
            };
          })
        : sc.steps.map((s, i) => {
            totalSteps++;
            if (s.status === 'passed') passedSteps++;
            else if (s.status === 'failed') { failedStepsCount++; failedStepDetails.push({ keyword: '', text: s.text, error: s.error }); }
            else skippedSteps++;
            allStepDurations.push(s.durationMs);
            allStepStatuses.push(s.status);
            const kw = s.text.match(/^(Given|When|Then|And|But)\s/i)?.[1] ?? '';
            const txt = kw ? s.text.slice(kw.length + 1) : s.text;
            return {
              stepNumber: i + 1, keyword: kw, text: txt,
              status: s.status, durationMs: s.durationMs,
              error: s.error, screenshotBase64: s.screenshot ?? '', logs: [],
            };
          });

      if (rich) {
        allSuccessLogs.push(...rich.successLogs);
        allErrorLogs.push(...rich.errorLogs);
      }

      return {
        name: sc.name,
        featureName: sc.featureName,
        tags: sc.tags,
        status: sc.status,
        durationMs: sc.durationMs,
        totalSteps: steps.length,
        passedSteps: steps.filter((s) => s.status === 'passed').length,
        steps,
      };
    });

    const featureMap = new Map<string, { name: string; scenarioCount: number; totalSteps: number; passedScenarios: number; failedScenarios: number; passRate: number }>();
    for (const sc of scenarioBlocks) {
      const f = featureMap.get(sc.featureName) ?? { name: sc.featureName, scenarioCount: 0, totalSteps: 0, passedScenarios: 0, failedScenarios: 0, passRate: 0 };
      f.scenarioCount++;
      f.totalSteps += sc.totalSteps;
      if (sc.status === 'passed') f.passedScenarios++; else f.failedScenarios++;
      f.passRate = f.scenarioCount > 0 ? Math.round((f.passedScenarios / f.scenarioCount) * 100) : 0;
      featureMap.set(sc.featureName, f);
    }

    const allDurations = allStepDurations.length > 0 ? allStepDurations : [0];
    const fastest = Math.min(...allDurations);
    const slowest = Math.max(...allDurations);
    const stepSuccessRate = totalSteps > 0 ? Math.round((passedSteps / totalSteps) * 100) : 0;

    const suiteRows = summary.featureStats.map((fs) => ({
      featureName: fs.featureName,
      scenarios: fs.scenarioCount,
      passed: fs.passed,
      failed: fs.failed,
      skipPend: fs.skipped + fs.pending,
    }));

    const allTags = [...new Set(scenarioBlocks.flatMap((sc) => sc.tags))];
    const firstScenarioData = scenarioDataList[0];

    const startIso = summary.scenarios.length > 0 ? summary.scenarios[0].startedAt : new Date().toISOString();
    const endIso = summary.scenarios.length > 0 ? summary.scenarios[summary.scenarios.length - 1].finishedAt : new Date().toISOString();

    return {
      totalFeatures: summary.totalFeatures,
      totalScenarios: summary.totalScenarios,
      totalSteps,
      passedSteps,
      failedSteps: failedStepsCount,
      skippedSteps,
      stepSuccessRate,
      scenarioPassed: summary.passed,
      scenarioFailed: summary.failed,
      scenarioSkipped: summary.skipped,
      scenarioPending: summary.pending,
      scenarioPassRate: summary.passRate,
      durationMs: summary.durationMs,
      overallStatus: summary.failed > 0 ? 'FAILED' : 'PASSED',
      startTime: new Date(startIso).toLocaleString('es-ES'),
      endTime: new Date(endIso).toLocaleString('es-ES'),
      fastest,
      slowest,
      features: [...featureMap.values()],
      suiteRows,
      scenarioBlocks,
      successLogs: allSuccessLogs,
      errorLogs: allErrorLogs,
      failedStepDetails,
      unstableFeatures: [...featureMap.values()].filter((f) => f.failedScenarios > 0),
      allTags,
      videos,
      browserName: firstScenarioData?.browserInfo?.name ?? process.env['AURA_BROWSER'] ?? 'chromium',
      headless: firstScenarioData?.browserInfo?.headless ?? process.env['AURA_HEADLESS'] === 'true',
      viewport: firstScenarioData?.browserInfo?.viewport ?? '1280×800',
      testerName: firstScenarioData?.tester?.name ?? process.env['AURA_TESTER_NAME'] ?? 'SAI Automation',
      testerEmail: firstScenarioData?.tester?.email ?? process.env['AURA_TESTER_EMAIL'] ?? '',
      allStepDurations,
      allStepStatuses,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Minimal Markdown → HTML for AI executive summary (headings, paragraphs, bullets). */
  private mdHtml(md: string): string {
    const inline = (raw: string): string => {
      let h = esc(raw);
      h = h.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
      h = h.replace(/\*(.+?)\*/g, '<em class="text-gray-300">$1</em>');
      return h;
    };
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const out: string[] = [];
    let para: string[] = [];
    let list: string[] = [];

    const flushPara = (): void => {
      if (para.length === 0) return;
      const text = para.join(' ').trim();
      para = [];
      if (text) out.push(`<p class="mb-3 text-gray-300 leading-relaxed">${inline(text)}</p>`);
    };
    const flushList = (): void => {
      if (list.length === 0) return;
      const items = list.map((li) => `<li class="mb-1.5 pl-0">${inline(li)}</li>`).join('');
      out.push(`<ul class="list-disc pl-5 mb-4 text-gray-300 space-y-1 marker:text-aura-400">${items}</ul>`);
      list = [];
    };

    for (const line of lines) {
      const t = line.trim();
      /* AI prompt uses ## for the 10 main sections; ### for subsections under Hallazgos */
      if (t.startsWith('### ')) {
        flushList(); flushPara();
        out.push(`<h4 class="text-base font-semibold text-aura-200 mt-4 mb-1.5">${inline(t.slice(4))}</h4>`);
        continue;
      }
      if (t.startsWith('## ')) {
        flushList(); flushPara();
        out.push(`<h2 class="text-xl font-bold text-white mt-6 mb-2 first:mt-0 border-b border-gray-700/50 pb-2">${inline(t.slice(3))}</h2>`);
        continue;
      }
      if (t.startsWith('# ')) {
        flushList(); flushPara();
        out.push(`<h2 class="text-xl font-bold text-white mt-6 mb-2 border-b border-gray-700/50 pb-2">${inline(t.slice(2))}</h2>`);
        continue;
      }
      if (/^[-*]\s+/.test(t)) {
        flushPara();
        list.push(t.replace(/^[-*]\s+/, ''));
        continue;
      }
      if (t === '') {
        flushList();
        flushPara();
        continue;
      }
      flushList();
      para.push(t);
    }
    flushList();
    flushPara();
    return out.join('\n');
  }

  private timeFromISO(iso: string): string {
    try { return new Date(iso).toLocaleTimeString('es-ES'); } catch { return iso; }
  }

}

// ─── Template Types ──────────────────────────────────────────────────────────

interface TemplateStep {
  stepNumber: number;
  keyword: string;
  text: string;
  status: string;
  durationMs: number;
  error?: string;
  screenshotBase64: string;
  logs: AuraLogEntry[];
}

interface TemplateScenario {
  name: string;
  featureName: string;
  tags: readonly string[];
  status: string;
  durationMs: number;
  totalSteps: number;
  passedSteps: number;
  steps: TemplateStep[];
}

interface TemplateData {
  totalFeatures: number;
  totalScenarios: number;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  /** % éxito a nivel de pasos Gherkin */
  stepSuccessRate: number;
  scenarioPassed: number;
  scenarioFailed: number;
  scenarioSkipped: number;
  scenarioPending: number;
  /** % éxito a nivel de escenarios (KPI principal) */
  scenarioPassRate: number;
  durationMs: number;
  overallStatus: string;
  startTime: string;
  endTime: string;
  fastest: number;
  slowest: number;
  features: Array<{ name: string; scenarioCount: number; totalSteps: number; passedScenarios: number; failedScenarios: number; passRate: number }>;
  suiteRows: Array<{ featureName: string; scenarios: number; passed: number; failed: number; skipPend: number }>;
  scenarioBlocks: TemplateScenario[];
  successLogs: AuraLogEntry[];
  errorLogs: AuraLogEntry[];
  failedStepDetails: Array<{ keyword: string; text: string; error?: string }>;
  unstableFeatures: Array<{ name: string; failedScenarios: number }>;
  allTags: string[];
  videos: Array<{ path: string; label: string }>;
  browserName: string;
  headless: boolean;
  viewport: string;
  testerName: string;
  testerEmail: string;
  allStepDurations: number[];
  allStepStatuses: string[];
}

// ─── Standalone helper functions (used in template literals) ─────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDur(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function badge(status: string): string {
  const m: Record<string, string> = {
    passed: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
    failed: 'bg-red-900/40 text-red-300 border-red-700',
    skipped: 'bg-gray-800 text-gray-400 border-gray-600',
    pending: 'bg-amber-900/40 text-amber-300 border-amber-700',
  };
  return `<span class="px-2 py-0.5 rounded text-[10px] font-bold border ${m[status] ?? m.skipped}">${status.toUpperCase()}</span>`;
}

function tabBtn(id: string, icon: string, key: string, label: string, active = false): string {
  return `<button data-tab="${id}" class="tab-btn flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 ${active ? 'border-aura-500 text-aura-300 bg-aura-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'} transition-colors whitespace-nowrap"><i class="bi ${icon}"></i><span data-i18n="${key}">${label}</span></button>`;
}

function kpiCard(icon: string, key: string, label: string, val: string | number, color: string): string {
  const cm: Record<string, string> = {
    aura: 'bg-aura-900/30 border-aura-800/50 text-aura-300',
    emerald: 'bg-emerald-900/30 border-emerald-800/50 text-emerald-300',
    red: 'bg-red-900/30 border-red-800/50 text-red-300',
    blue: 'bg-blue-900/30 border-blue-800/50 text-blue-300',
    amber: 'bg-amber-900/30 border-amber-800/50 text-amber-300',
    gray: 'bg-gray-800/40 border-gray-600/50 text-gray-300',
  };
  return `<div class="rounded-xl border p-4 ${cm[color] ?? cm.aura}"><div class="flex items-center gap-2 mb-2"><i class="bi ${icon} text-lg"></i><span class="text-xs font-medium" data-i18n="${key}">${label}</span></div><p class="text-2xl font-bold text-white">${val}</p></div>`;
}

function statCard(icon: string, key: string, label: string, val: string | number): string {
  return `<div class="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30"><i class="bi ${icon} text-gray-500"></i><div class="flex-1"><p class="text-xs text-gray-400" data-i18n="${key}">${label}</p></div><p class="text-sm font-semibold text-white">${val}</p></div>`;
}

// ─── Cucumber JSON Shape ──────────────────────────────────────────────────────

interface CucumberStep {
  name?: string;
  keyword?: string;
  hidden?: boolean;
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

// ─── CLI ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const { config: dotenvConfig } = require('dotenv');
  const rootEnv = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', '.env');
  dotenvConfig({ path: rootEnv });
  dotenvConfig();

  const input  = process.env['AURA_REPORT_INPUT']  ?? 'reports/cucumber-report.json';
  const output = process.env['AURA_REPORT_OUTPUT'] ?? 'reports';
  const title  = process.env['AURA_REPORT_TITLE']  ?? 'SAI Test Report';
  const theme = parseReportThemeEnv(process.env['AURA_REPORT_THEME']);

  new TailwindReportEngine(input, output, title, theme)
    .generate()
    .then(() => console.log('[AURA/Report] Done.'))
    .catch(console.error);
}
