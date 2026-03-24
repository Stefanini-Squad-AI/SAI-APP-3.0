/**
 * AURA — Report Collector & Generator
 * Evidencias por paso (screenshots/videos) en la carpeta **única** de la ejecución.
 *
 * Estructura (una por corrida, no por escenario):
 *   reports/<YYYY-MM-DD>/<suiteFolder>/vN/
 *     ├─ automation-functional-report.html   ← informe único (TailwindReportEngine)
 *     ├─ cucumber-report.json (copia opcional)
 *     ├─ screenshots/   (prefijo = nombre escenario)
 *     └─ videos/
 *
 * HTML rico por escenario (AuraHtmlTemplate) solo si AURA_WRITE_SCENARIO_AURA_HTML=true.
 * En modo normal, escribe JSONL completo para que TailwindReportEngine genere el reporte consolidado.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Page } from 'playwright';
import { createLLMAdapter } from '../cognitive/LLMAdapterFactory';
import type { AIAdapter } from '../cognitive/LLMAdapterFactory';
import { renderAuraHtml } from './AuraHtmlTemplate';
import type { IntentResult } from '../../types/index';
import { allocateVersionedRunDirectory } from './reportRunDirectory';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuraLogEntry {
  readonly timestamp: string;
  readonly level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING';
  readonly message: string;
  readonly element?: string;
  readonly action?: string;
  readonly details?: string;
}

export interface AuraStepData {
  stepNumber: number;
  keyword: string;
  text: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  durationMs: number;
  error?: string;
  screenshotPath?: string;
  logs: AuraLogEntry[];
}

export interface AuraReportData {
  testName: string;
  featureName: string;
  scenarioName: string;
  tags: string[];
  startTime: string;
  endTime: string;
  durationMs: number;
  status: 'PASSED' | 'FAILED';
  steps: AuraStepData[];
  successLogs: AuraLogEntry[];
  errorLogs: AuraLogEntry[];
  summary: {
    totalSteps: number;
    passedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    pendingSteps: number;
    successRate: number;
  };
  browserInfo: { name: string; headless: boolean; viewport: string };
  tester: { name: string; email: string };
  executiveSummary?: string;
  executiveSummaryByLang?: {
    en: string;
    es: string;
    pt: string;
  };
  videoRelPath?: string;
  reportVersion: string;
}

// ─── Collector ───────────────────────────────────────────────────────────────

export class AuraReportCollector {
  private steps: AuraStepData[] = [];
  private successLogs: AuraLogEntry[] = [];
  private errorLogs: AuraLogEntry[] = [];
  private currentStepLogs: AuraLogEntry[] = [];

  private scenarioName = '';
  private featureName = '';
  private tags: string[] = [];
  private startTime = '';
  private overallStatus: 'PASSED' | 'FAILED' = 'PASSED';

  private currentStepNumber = 0;
  private currentStepStart = 0;
  private preActionScreenshot: string | undefined;

  private reportDir = '';
  private screenshotsDir = '';
  private videosDir = '';

  constructor(private readonly baseDir: string = 'reports') {}

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  startScenario(scenarioName: string, featureName: string, tags: string[]): void {
    this.scenarioName = scenarioName;
    this.featureName = featureName;
    this.tags = tags;
    this.startTime = new Date().toISOString();
    this.steps = [];
    this.successLogs = [];
    this.errorLogs = [];
    this.currentStepNumber = 0;
    this.overallStatus = 'PASSED';

    this.reportDir = this.buildReportDir();
    this.screenshotsDir = path.join(this.reportDir, 'screenshots');
    this.videosDir = path.join(this.reportDir, 'videos');
    fs.mkdirSync(this.screenshotsDir, { recursive: true });
    fs.mkdirSync(this.videosDir, { recursive: true });

    this.addLog('INFO', `Scenario started: ${scenarioName}`, undefined, 'init', `Feature: ${featureName}`);
  }

  startStep(keyword: string, text: string): void {
    this.currentStepNumber++;
    this.currentStepStart = Date.now();
    this.currentStepLogs = [];
    this.preActionScreenshot = undefined;
    this.addLog('INFO', `Starting step: ${keyword} ${text}`, text, keyword);
  }

  /** Prefijo de archivo para no pisar capturas entre escenarios en la misma carpeta vN. */
  private scenarioFilePrefix(): string {
    return `${sanitize(this.scenarioName)}-`;
  }

  /**
   * Captures a screenshot BEFORE a destructive action (e.g. click).
   * Called via the WebActions beforeClick hook so the evidence shows
   * the element being targeted, not the page state after the action.
   */
  async capturePreActionScreenshot(page: Page): Promise<void> {
    try {
      const fileName = `${this.scenarioFilePrefix()}step-${this.currentStepNumber}-pre-click.png`;
      const fullPath = path.join(this.screenshotsDir, fileName);
      await page.screenshot({ path: fullPath, fullPage: false });
      this.preActionScreenshot = `screenshots/${fileName}`;
    } catch { /* non-critical */ }
  }

  /**
   * Injects detailed intent results from WebActions into step logs.
   * Called from AfterStep hook with the collected intent results.
   */
  addIntentResults(intents: readonly IntentResult[]): void {
    for (const ir of intents) {
      const selector = ir.resolvedSelector ?? '—';
      if (ir.success) {
        this.addLog(
          'SUCCESS',
          `${ir.action} completed successfully`,
          ir.target,
          ir.action,
          `Selector: ${selector} · Duration: ${ir.durationMs}ms`,
        );
      } else {
        this.addLog(
          'ERROR',
          `${ir.action} FAILED: ${ir.error ?? 'Unknown error'}`,
          ir.target,
          ir.action,
          `Selector: ${selector} · Duration: ${ir.durationMs}ms · Error: ${ir.error ?? ''}`,
        );
      }
    }
  }

  async endStep(
    keyword: string,
    text: string,
    status: 'passed' | 'failed' | 'skipped' | 'pending',
    page: Page | null,
    error?: string,
  ): Promise<void> {
    const durationMs = Date.now() - this.currentStepStart;
    let screenshotPath: string | undefined;

    if (this.preActionScreenshot) {
      screenshotPath = this.preActionScreenshot;
      this.preActionScreenshot = undefined;
      this.addLog('SUCCESS', 'Captured pre-action screenshot', undefined, 'screenshot');
    } else if (page && status !== 'skipped') {
      try {
        const fileName = `${this.scenarioFilePrefix()}step-${this.currentStepNumber}-${sanitize(keyword)}.png`;
        const fullPath = path.join(this.screenshotsDir, fileName);
        await page.screenshot({ path: fullPath, fullPage: false });
        screenshotPath = `screenshots/${fileName}`;
        this.addLog('SUCCESS', `Screenshot captured: ${fileName}`, undefined, 'screenshot');
      } catch {
        this.addLog('WARNING', 'Could not capture screenshot for this step');
      }
    }

    if (status === 'passed') {
      this.addLog('SUCCESS', 'Step completed successfully', text, keyword, `Duration: ${durationMs}ms`);
    } else if (status === 'failed') {
      this.overallStatus = 'FAILED';
      this.addLog('ERROR', `Step FAILED: ${error ?? 'Unknown error'}`, text, keyword, error);
    }

    this.steps.push({
      stepNumber: this.currentStepNumber,
      keyword,
      text,
      status,
      durationMs,
      error,
      screenshotPath,
      logs: [...this.currentStepLogs],
    });
  }

  addLog(
    level: AuraLogEntry['level'],
    message: string,
    element?: string,
    action?: string,
    details?: string,
  ): void {
    const entry: AuraLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      element,
      action,
      details,
    };
    this.currentStepLogs.push(entry);

    if (level === 'SUCCESS') this.successLogs.push(entry);
    if (level === 'ERROR') this.errorLogs.push(entry);
  }

  // ─── Report Generation ──────────────────────────────────────────────────────

  async generateReport(videoSourcePath?: string): Promise<string> {
    const endTime = new Date().toISOString();
    const durationMs = new Date(endTime).getTime() - new Date(this.startTime).getTime();

    let videoRelPath: string | undefined;
    if (videoSourcePath && fs.existsSync(videoSourcePath)) {
      const videoName = `${sanitize(this.scenarioName)}.webm`;
      const dest = path.join(this.videosDir, videoName);
      fs.copyFileSync(videoSourcePath, dest);
      videoRelPath = `videos/${videoName}`;
    }

    const totalSteps = this.steps.length;
    const passedSteps = this.steps.filter(s => s.status === 'passed').length;
    const failedSteps = this.steps.filter(s => s.status === 'failed').length;
    const skippedSteps = this.steps.filter(s => s.status === 'skipped').length;
    const pendingSteps = this.steps.filter(s => s.status === 'pending').length;

    const data: AuraReportData = {
      testName: process.env['AURA_REPORT_TITLE'] ?? 'SAI Test Report',
      featureName: this.featureName,
      scenarioName: this.scenarioName,
      tags: this.tags,
      startTime: this.startTime,
      endTime,
      durationMs,
      status: this.overallStatus,
      steps: this.steps,
      successLogs: this.successLogs,
      errorLogs: this.errorLogs,
      summary: {
        totalSteps,
        passedSteps,
        failedSteps,
        skippedSteps,
        pendingSteps,
        successRate: totalSteps > 0 ? Math.round((passedSteps / totalSteps) * 100) : 0,
      },
      browserInfo: {
        name: process.env['AURA_BROWSER'] ?? 'chromium',
        headless: process.env['AURA_HEADLESS'] === 'true',
        viewport: '1280×800',
      },
      tester: {
        name: process.env['AURA_TESTER_NAME'] ?? 'SAI Automation',
        email: process.env['AURA_TESTER_EMAIL'] ?? '',
      },
      videoRelPath,
      reportVersion: process.env['AURA_REPORT_VERSION'] ?? '1.0.0',
    };

    const writeScenarioAura = process.env['AURA_WRITE_SCENARIO_AURA_HTML'] === 'true';
    if (!writeScenarioAura) {
      const jsonl = path.join(this.reportDir, 'aura-scenarios.jsonl');
      fs.appendFileSync(jsonl, `${JSON.stringify(data)}\n`, 'utf8');
      console.info(
        `[AURA/Report] Datos escenario → ${jsonl} (informe consolidado: automation-functional-report.html)`,
      );
      return '';
    }

    const executiveSummaries = await this.generateExecutiveSummaries(data);
    data.executiveSummaryByLang = executiveSummaries;
    data.executiveSummary = executiveSummaries.en || '';

    const jsonPath = path.join(this.reportDir, 'aura-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.info(`[AURA/Report] ✓ JSON  → ${jsonPath}`);

    const htmlPath = path.join(this.reportDir, 'aura-report.html');
    fs.writeFileSync(htmlPath, renderAuraHtml(data));
    console.info(`[AURA/Report] ✓ HTML  → ${htmlPath}`);

    return htmlPath;
  }

  getReportDir(): string {
    return this.reportDir;
  }

  // ─── AI Executive Summary ───────────────────────────────────────────────────

  private async generateExecutiveSummaries(
    data: AuraReportData,
  ): Promise<{ en: string; es: string; pt: string }> {
    try {
      const adapter: AIAdapter = createLLMAdapter();

      const systemPrompt = `You are a senior QA / test automation lead writing a structured EXECUTIVE FUNCTIONAL TEST REPORT for business and engineering stakeholders.
Output Markdown only inside JSON string values (no HTML). For EACH language use the SAME outline and depth.

Style and audience:
- Explain at a high level in clear, professional prose. Readers may not be deeply technical: define acronyms once, avoid jargon dumps, connect results to user-facing risk and quality.
- Be substantive: each section should add real insight from the data (not filler).
- Do NOT use emojis, decorative symbols, or numeric reference markers like [1] or [12].
- Do NOT include fenced code blocks (\`\`\`), inline code snippets, file paths in backticks, or pasted JSON.
- Use ## for the 10 main sections. Under "Hallazgos" / "Findings" / "Achados" use exactly these three ### subsections.
- Use bullet lists (- item) where helpful.
- Avoid raw stack traces; paraphrase error themes.

Return ONLY valid JSON (no markdown fences):
{"en":"<markdown>","es":"<markdown>","pt":"<markdown>"}

**es** — use EXACTLY these headings:
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

      const userPrompt = `Analyze these test results and generate an executive summary:

Test: ${data.scenarioName}
Feature: ${data.featureName}
Status: ${data.status}
Duration: ${(data.durationMs / 1000).toFixed(1)}s
Steps: ${data.summary.totalSteps} total, ${data.summary.passedSteps} passed, ${data.summary.failedSteps} failed
Success Rate: ${data.summary.successRate}%
Browser: ${data.browserInfo.name}
Date: ${data.startTime}

Steps detail:
${data.steps.map(s => `  ${s.stepNumber}. [${s.status.toUpperCase()}] ${s.keyword} ${s.text} (${s.durationMs}ms)${s.error ? ' — Error: ' + s.error : ''}`).join('\n')}

${data.errorLogs.length > 0 ? 'Errors found:\n' + data.errorLogs.map(l => `  - ${l.message}`).join('\n') : 'No errors found.'}`;

      console.info('[AURA/Report] Generating multilingual executive summaries with AI...');
      const response = await adapter.complete({
        system: systemPrompt,
        user: userPrompt,
        temperature: 0.35,
        maxTokens: 8192,
      });

      const parsed = parseSummaryJson(response.content);
      if (parsed) {
        console.info(`[AURA/Report] ✓ Multilingual executive summaries generated (${response.tokensUsed} tokens, ${response.latencyMs}ms)`);
        return sanitizeExecutiveSummaryByLang(parsed);
      }

      console.warn('[AURA/Report] ⚠ AI summary JSON was invalid. Falling back to English-only summary.');
      return sanitizeExecutiveSummaryByLang({
        en: response.content.trim(),
        es: response.content.trim(),
        pt: response.content.trim(),
      });
    } catch (err) {
      console.warn('[AURA/Report] ⚠ Could not generate AI executive summaries:', err instanceof Error ? err.message : err);
      return { en: '', es: '', pt: '' };
    }
  }

  // ─── Folder Structure ───────────────────────────────────────────────────────

  private buildReportDir(): string {
    const envDir = process.env['AURA_RUN_REPORT_DIR']?.trim();
    if (envDir) {
      const resolved = path.resolve(envDir);
      fs.mkdirSync(resolved, { recursive: true });
      return resolved;
    }
    const suite = process.env['AURA_SUITE_FOLDER']?.trim() || 'Aura';
    const runDir = allocateVersionedRunDirectory(this.baseDir, suite);
    process.env['AURA_RUN_REPORT_DIR'] = runDir;
    return runDir;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function sanitizeExecutiveMarkdown(md: string): string {
  if (!md) return '';
  let s = md.replace(/\[\d+\]/g, '');
  s = s.replace(/```[\s\S]*?```/g, '');
  s = s.replace(/\p{Extended_Pictographic}/gu, '');
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

function sanitizeExecutiveSummaryByLang(obj: { en: string; es: string; pt: string }): {
  en: string;
  es: string;
  pt: string;
} {
  return {
    en: sanitizeExecutiveMarkdown(obj.en),
    es: sanitizeExecutiveMarkdown(obj.es),
    pt: sanitizeExecutiveMarkdown(obj.pt),
  };
}

function parseSummaryJson(raw: string): { en: string; es: string; pt: string } | null {
  const direct = tryParseJson(raw);
  if (direct) return direct;

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (!fenced?.[1]) return null;
  return tryParseJson(fenced[1]);
}

function tryParseJson(value: string): { en: string; es: string; pt: string } | null {
  try {
    const parsed = JSON.parse(value.trim()) as Partial<Record<'en' | 'es' | 'pt', unknown>>;
    const en = typeof parsed.en === 'string' ? parsed.en.trim() : '';
    const es = typeof parsed.es === 'string' ? parsed.es.trim() : '';
    const pt = typeof parsed.pt === 'string' ? parsed.pt.trim() : '';

    if (!en && !es && !pt) return null;

    return {
      en: en || es || pt || '',
      es: es || en || pt || '',
      pt: pt || en || es || '',
    };
  } catch {
    return null;
  }
}
