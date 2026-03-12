/**
 * AURA — Report Collector & Generator
 * Collects test execution data and generates rich HTML + JSON reports.
 *
 * Folder structure:
 *   reports/<YYYY-MM-DD>/<scenario-name>/<vN>/
 *     ├─ aura-report.html
 *     ├─ aura-report.json
 *     ├─ screenshots/
 *     └─ videos/
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Page } from 'playwright';
import { createLLMAdapter } from '../cognitive/LLMAdapterFactory';
import type { AIAdapter } from '../cognitive/LLMAdapterFactory';
import { renderAuraHtml } from './AuraHtmlTemplate';
import type { IntentResult } from '../../types/index';

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

  /**
   * Captures a screenshot BEFORE a destructive action (e.g. click).
   * Called via the WebActions beforeClick hook so the evidence shows
   * the element being targeted, not the page state after the action.
   */
  async capturePreActionScreenshot(page: Page): Promise<void> {
    try {
      const fileName = `step-${this.currentStepNumber}-pre-click.png`;
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
        const fileName = `step-${this.currentStepNumber}-${sanitize(keyword)}.png`;
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
      const videoName = 'test-recording.webm';
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

    data.executiveSummary = await this.generateExecutiveSummary(data);

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

  private async generateExecutiveSummary(data: AuraReportData): Promise<string> {
    try {
      const adapter: AIAdapter = createLLMAdapter();

      const systemPrompt = `You are a senior QA manager writing executive test summaries for stakeholders.
Write a CONCISE executive summary (3-5 paragraphs) in English.
The summary must be NON-TECHNICAL, focused on business impact.
Include: overall result, key findings, risk assessment, and recommendation.
DO NOT include code, selectors, or technical details.
Use professional but clear language suitable for C-level executives.`;

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

      console.info('[AURA/Report] Generating executive summary with AI...');
      const response = await adapter.complete({
        system: systemPrompt,
        user: userPrompt,
        temperature: 0.4,
        maxTokens: 1024,
      });

      console.info(`[AURA/Report] ✓ Executive summary generated (${response.tokensUsed} tokens, ${response.latencyMs}ms)`);
      return response.content;
    } catch (err) {
      console.warn('[AURA/Report] ⚠ Could not generate AI executive summary:', err instanceof Error ? err.message : err);
      return '';
    }
  }

  // ─── Folder Structure ───────────────────────────────────────────────────────

  private buildReportDir(): string {
    const today = new Date().toISOString().slice(0, 10);
    const scenarioDir = sanitize(this.scenarioName);
    const datePath = path.join(this.baseDir, today, scenarioDir);

    fs.mkdirSync(datePath, { recursive: true });

    let version = 1;
    while (fs.existsSync(path.join(datePath, `v${version}`))) {
      version++;
    }

    const versionDir = path.join(datePath, `v${version}`);
    fs.mkdirSync(versionDir, { recursive: true });
    return versionDir;
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
