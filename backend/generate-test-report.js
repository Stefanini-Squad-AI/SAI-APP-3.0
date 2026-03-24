#!/usr/bin/env node

/**
 * Backend Unit Test Report Generator — AURA Style
 *
 * Reads TRX + Cobertura XML and produces:
 *   - test-report.html  (TailwindCSS, i18n ES/EN/PT, Dark/Grey Mode, Perplexity AI Executive Summary)
 *   - test-report.md    (Markdown summary)
 *
 * Environment variables (optional):
 *   PERPLEXITY_API_KEY  — enables AI executive summary
 *   PERPLEXITY_MODEL    — model to use (default: sonar)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseStringPromise } from 'xml2js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from repo root (optional — enables PERPLEXITY_API_KEY without manual export)
try {
  const { default: dotenv } = await import('dotenv');
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
  dotenv.config({ path: path.resolve(__dirname, '.env') });
} catch { /* dotenv is optional */ }

const TRX_PATH = path.join(__dirname, 'TestResults', 'test-results.trx');
const TEST_RESULTS_DIR = path.join(__dirname, 'TestResults');
const HTML_REPORT_PATH = path.join(__dirname, 'TestResults', 'test-report.html');
const MARKDOWN_REPORT_PATH = path.join(__dirname, 'TestResults', 'test-report.md');

// ─── XML Parsing ──────────────────────────────────────────────────────────────

function findCoberturaFile(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const found = findCoberturaFile(fullPath);
      if (found) return found;
    } else if (file === 'coverage.cobertura.xml') {
      return fullPath;
    }
  }
  return null;
}

async function parseTrxFile() {
  if (!fs.existsSync(TRX_PATH)) {
    console.error(`TRX file not found: ${TRX_PATH}`);
    process.exit(1);
  }
  const trxContent = fs.readFileSync(TRX_PATH, 'utf-8');
  return parseStringPromise(trxContent);
}

async function parseCoberturaFile() {
  const cobPath = findCoberturaFile(TEST_RESULTS_DIR);
  if (!cobPath) {
    console.warn(`  Coverage file not found in: ${TEST_RESULTS_DIR}`);
    return null;
  }
  console.log(`  Coverage file found: ${cobPath}`);
  const content = fs.readFileSync(cobPath, 'utf-8');
  return parseStringPromise(content);
}

function extractTestInfo(trxData) {
  const testRun = trxData.TestRun;
  const results = testRun.Results?.[0]?.UnitTestResult || [];
  const counters = testRun.ResultSummary?.[0]?.Counters?.[0]?.$;
  const definitions = testRun.TestDefinitions?.[0]?.UnitTest || [];

  const defsMap = {};
  definitions.forEach(def => {
    const id = def.$.id;
    const method = def.TestMethod?.[0]?.$;
    defsMap[id] = { className: method?.className || 'Unknown', fullName: (method?.className || '') + '.' + (method?.name || '') };
  });

  const tests = results.map(test => {
    const attrs = test.$;
    const def = defsMap[attrs.testId] || {};
    return {
      name: attrs.testName || 'Unknown Test',
      outcome: attrs.outcome || 'Unknown',
      duration: attrs.duration || '00:00:00',
      className: def.className,
      fullName: def.fullName,
      errorMessage: test.Output?.[0]?.ErrorInfo?.[0]?.Message?.[0] || null,
      stackTrace: test.Output?.[0]?.ErrorInfo?.[0]?.StackTrace?.[0] || null,
    };
  });

  return {
    total: Number.parseInt(counters?.total || 0),
    passed: Number.parseInt(counters?.passed || 0),
    failed: Number.parseInt(counters?.failed || 0),
    skipped: Number.parseInt(counters?.inconclusive || 0),
    tests,
  };
}

function extractCoverageInfo(coberturaData) {
  if (!coberturaData) return null;
  const cov = coberturaData.coverage;
  const packages = cov.packages?.[0]?.package || [];
  const lineRate = Number.parseFloat(cov.$['line-rate'] || 0) * 100;
  const branchRate = Number.parseFloat(cov.$['branch-rate'] || 0) * 100;

  const packageDetails = packages.map(pkg => {
    const pkgLineRate = Number.parseFloat(pkg.$['line-rate'] || 0) * 100;
    const pkgBranchRate = Number.parseFloat(pkg.$['branch-rate'] || 0) * 100;
    const classes = (pkg.classes?.[0]?.class || []).map(cls => {
      const lines = cls.lines?.[0]?.line || [];
      const totalLines = lines.length;
      const coveredLines = lines.filter(l => Number.parseInt(l.$.hits) > 0).length;
      return {
        name: cls.$.name || 'Unknown',
        filename: cls.$.filename || '',
        lineRate: Number.parseFloat(cls.$['line-rate'] || 0) * 100,
        branchRate: Number.parseFloat(cls.$['branch-rate'] || 0) * 100,
        totalLines, coveredLines, uncoveredLines: totalLines - coveredLines,
      };
    });
    return { name: pkg.$.name || 'Unknown', lineRate: pkgLineRate, branchRate: pkgBranchRate, classes };
  });

  return { lineRate, branchRate, packages: packageDetails };
}

// ─── Perplexity AI Executive Summary ──────────────────────────────────────────

function sanitizeExecutiveMarkdown(md) {
  if (!md || typeof md !== 'string') return '';
  let s = md.replace(/\[\d+\]/g, '');
  s = s.replace(/```[\s\S]*?```/g, '');
  s = s.replace(/\p{Extended_Pictographic}/gu, '');
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

function sanitizeExecutiveSummaryByLang(obj) {
  if (!obj) return obj;
  return {
    en: sanitizeExecutiveMarkdown(obj.en),
    es: sanitizeExecutiveMarkdown(obj.es),
    pt: sanitizeExecutiveMarkdown(obj.pt),
  };
}

async function generateExecutiveSummary(testInfo, coverageInfo) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    console.log('  PERPLEXITY_API_KEY not set — skipping AI executive summary.');
    return { en: '', es: '', pt: '' };
  }

  const model = process.env.PERPLEXITY_MODEL || 'sonar';
  const passRate = testInfo.total > 0 ? ((testInfo.passed / testInfo.total) * 100).toFixed(2) : '0';

  const testsByClass = {};
  testInfo.tests.forEach(t => {
    const cls = t.className || 'Unknown';
    if (!testsByClass[cls]) testsByClass[cls] = [];
    testsByClass[cls].push(t);
  });

  const systemPrompt = `You are a senior QA / engineering lead writing a structured EXECUTIVE UNIT-TEST REPORT for a .NET / xUnit backend.
Output Markdown only inside JSON string values (no HTML). For EACH language use the SAME outline and depth.

Style and audience:
- Explain at a high level in clear, professional prose. Readers may not be deeply technical: define acronyms once, avoid jargon dumps, connect numbers to business impact.
- Be substantive: each section should add real insight from the data (not filler).
- Do NOT use emojis, decorative symbols, or numeric reference markers like [1] or [12].
- Do NOT include fenced code blocks (\`\`\`), inline code snippets of config files, file paths in backticks, or pasted JSON.
- Use ## for the 10 main sections. Under "Hallazgos" / "Findings" / "Achados" use exactly these three ### subsections.
- Use bullet lists (- item) where helpful.
- Avoid raw stack traces; paraphrase failure themes.
- Historical trend: usually single run — state explicitly if no prior data.
- Glossary: 4–8 plain-language terms (unit test, xUnit, line/branch coverage, etc.) in the target language.

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

  const classSummary = Object.entries(testsByClass).map(([cls, tests]) => {
    const p = tests.filter(t => t.outcome === 'Passed').length;
    const f = tests.filter(t => t.outcome === 'Failed').length;
    return `  - ${cls}: ${tests.length} tests, ${p} passed, ${f} failed`;
  }).join('\n');

  const failedTests = testInfo.tests.filter(t => t.outcome === 'Failed')
    .map(t => `  - [${t.className}] ${t.name}: ${t.errorMessage || 'No message'}`)
    .join('\n');

  const coverageSummary = coverageInfo
    ? `\nCode Coverage:\n  Line Coverage: ${coverageInfo.lineRate.toFixed(2)}%\n  Branch Coverage: ${coverageInfo.branchRate.toFixed(2)}%`
    : '';

  const userPrompt = `Analyze these Backend unit test results and generate an executive summary:

Project: TuCreditoOnline — Backend (.NET 8, xUnit, Clean Architecture)
Total Tests: ${testInfo.total}
Passed: ${testInfo.passed}
Failed: ${testInfo.failed}
Skipped: ${testInfo.skipped}
Pass Rate: ${passRate}%
Date: ${new Date().toISOString()}
${coverageSummary}

Test Classes:
${classSummary}

${failedTests ? 'Failed Tests:\n' + failedTests : 'No test failures detected.'}`;

  try {
    console.log(`  Calling Perplexity API (model: ${model})...`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        temperature: 0.35,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`  Perplexity API error: ${response.status} ${response.statusText} — ${errText}`);
      return { en: '', es: '', pt: '' };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    console.log(`  AI response received (${data.usage?.total_tokens ?? '?'} tokens).`);

    const parsed = parseSummaryJson(content);
    if (parsed) return sanitizeExecutiveSummaryByLang(parsed);
    return sanitizeExecutiveSummaryByLang({ en: content.trim(), es: content.trim(), pt: content.trim() });
  } catch (err) {
    console.warn(`  Perplexity API call failed: ${err?.message ?? String(err)}`);
    return { en: '', es: '', pt: '' };
  }
}

function parseSummaryJson(raw) {
  const tryParse = (str) => {
    try {
      const p = JSON.parse(str.trim());
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s) {
  if (!s) return '';
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function mdInline(raw) {
  let h = esc(raw);
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 dark:text-white font-semibold">$1</strong>');
  h = h.replace(/\*(.+?)\*/g, '<em class="text-slate-600 dark:text-gray-400">$1</em>');
  return h;
}

function mdToHtml(md) {
  if (!md) return '';
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = [];
  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(' ').trim();
    para = [];
    if (text) out.push(`<p class="mb-3 text-slate-600 dark:text-slate-300 leading-relaxed">${mdInline(text)}</p>`);
  };
  const flushList = () => {
    if (!list.length) return;
    const items = list.map((li) => `<li class="mb-1.5">${mdInline(li)}</li>`).join('');
    out.push(`<ul class="list-disc pl-5 mb-4 text-slate-600 dark:text-slate-300 space-y-1 marker:text-violet-500">${items}</ul>`);
    list = [];
  };
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('### ')) {
      flushList();
      flushPara();
      out.push(`<h4 class="text-base font-semibold text-violet-700 dark:text-violet-300 mt-4 mb-1.5">${mdInline(t.slice(4))}</h4>`);
      continue;
    }
    if (t.startsWith('## ')) {
      flushList();
      flushPara();
      out.push(`<h2 class="text-xl font-bold text-slate-800 dark:text-white mt-6 mb-2 first:mt-0 border-b border-slate-200 dark:border-zinc-700 pb-2">${mdInline(t.slice(3))}</h2>`);
      continue;
    }
    if (t.startsWith('# ')) {
      flushList();
      flushPara();
      out.push(`<h2 class="text-xl font-bold text-slate-800 dark:text-white mt-6 mb-2 border-b border-slate-200 dark:border-zinc-700 pb-2">${mdInline(t.slice(2))}</h2>`);
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

function formatDuration(duration) {
  const parts = duration.split(':');
  if (parts.length !== 3) return duration;
  const h = Number.parseInt(parts[0]), m = Number.parseInt(parts[1]), s = Number.parseFloat(parts[2]);
  if (h > 0) return `${h}h ${m}m ${s.toFixed(2)}s`;
  if (m > 0) return `${m}m ${s.toFixed(2)}s`;
  if (s >= 1) return `${s.toFixed(2)}s`;
  return `${(s * 1000).toFixed(0)}ms`;
}

function getCoverageClass(rate) {
  if (rate >= 70) return 'bg-emerald-500';
  if (rate >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function getCoverageBadge(rate) {
  if (rate >= 70) return 'text-emerald-700 dark:text-emerald-400';
  if (rate >= 40) return 'text-amber-700 dark:text-amber-400';
  return 'text-red-700 dark:text-red-400';
}

// ─── HTML Report ──────────────────────────────────────────────────────────────

function renderStackTraceDetails(t) {
  if (!t.stackTrace) return '';
  return `<details class="mt-2"><summary class="text-xs text-slate-500 dark:text-gray-400 cursor-pointer hover:text-slate-700 dark:hover:text-gray-300" data-i18n="stackTrace">Stack Trace</summary>
                <pre class="mt-2 text-xs text-slate-500 dark:text-gray-500 font-mono bg-slate-100 dark:bg-zinc-800 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap">${esc(t.stackTrace)}</pre></details>`;
}

function renderTestErrorRow(t) {
  if (!t.errorMessage) return '';
  return `
            <tr class="bg-red-50 dark:bg-red-950/20">
              <td colspan="3" class="px-4 py-3">
                <div class="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg p-3 mb-2">
                  <p class="text-xs font-semibold text-red-800 dark:text-red-300 mb-1" data-i18n="errorMessage">Error</p>
                  <p class="text-xs text-red-700 dark:text-red-400 font-mono break-all whitespace-pre-wrap max-h-32 overflow-y-auto">${esc(t.errorMessage)}</p>
                </div>
                ${renderStackTraceDetails(t)}
              </td>
            </tr>`;
}

function getPassRateTextClass(rate) {
  if (rate >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (rate >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getPassRateBgClass(rate) {
  if (rate >= 80) return 'bg-emerald-500';
  if (rate >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function generateHtmlReport(testInfo, coverageInfo, summaryByLang) {
  const passRate = testInfo.total > 0 ? ((testInfo.passed / testInfo.total) * 100).toFixed(2) : '0';
  const passRateNum = Number.parseFloat(passRate);

  const summaryHtmlByLang = {
    en: mdToHtml(summaryByLang.en),
    es: mdToHtml(summaryByLang.es),
    pt: mdToHtml(summaryByLang.pt),
  };
  const summaryJson = JSON.stringify(summaryHtmlByLang).replaceAll('</script', String.raw`<\/script`);

  const testsByClass = {};
  testInfo.tests.forEach(t => {
    const cls = t.className || 'Unknown';
    if (!testsByClass[cls]) testsByClass[cls] = [];
    testsByClass[cls].push(t);
  });
  const classEntries = Object.entries(testsByClass);

  const failedTests = testInfo.tests.filter(t => t.outcome === 'Failed');

  return `<!DOCTYPE html>
<html lang="es" class="">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Backend Unit Test Report — TuCreditoOnline</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<script>
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aura: {50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81',950:'#1e1b4b'},
        surface: {DEFAULT:'#18181b',card:'#1c1c1f',border:'#27272a'},
      },
      fontFamily: {
        sans: ['-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','sans-serif'],
        mono: ['Fira Code','Cascadia Code','Consolas','monospace'],
      },
    }
  }
};
</script>
<style>
.tab-btn.active{border-color:#6366f1;color:#6366f1;background:rgba(99,102,241,.08)}
.dark .tab-btn.active{color:#a5b4fc;background:rgba(99,102,241,.15)}
.tab-panel{display:none}.tab-panel.active{display:block}
.acc-body{max-height:0;overflow:hidden;transition:max-height .35s ease}
.acc-body.open{max-height:99999px}
.acc-chevron{transition:transform .2s}.acc-chevron.open{transform:rotate(90deg)}
.search-input{transition:border-color .2s}
.search-input:focus{outline:none;border-color:#6366f1}
</style>
</head>
<body class="bg-slate-100 text-slate-800 dark:bg-zinc-950 dark:text-zinc-100 min-h-screen font-sans transition-colors duration-300">

<!-- ═══ HEADER ═══ -->
<header class="bg-gradient-to-r from-aura-600 to-aura-800 dark:from-zinc-900 dark:to-zinc-900 border-b border-aura-700 dark:border-zinc-800 sticky top-0 z-40">
<div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
  <div class="flex items-center gap-3">
    <div class="w-9 h-9 rounded-lg bg-white/20 dark:bg-aura-600 flex items-center justify-center font-bold text-white text-[10px] tracking-tight">SAI</div>
    <div>
      <h1 class="text-lg font-bold text-white leading-tight" data-i18n="reportTitle">Reporte de Pruebas Unitarias — Backend</h1>
      <p class="text-xs text-white/70">.NET 8 · xUnit · Moq · FluentAssertions · ${new Date().toLocaleDateString('es-ES')}</p>
    </div>
  </div>
  <div class="flex items-center gap-3">
    <span class="px-3 py-1 rounded-full text-xs font-bold ${testInfo.failed === 0
      ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/50'
      : 'bg-red-500/20 text-red-100 border border-red-400/50'}">${testInfo.failed === 0 ? 'ALL PASSED' : testInfo.failed + ' FAILED'}</span>
    <select id="lang-select" onchange="switchLang(this.value)" class="bg-white/10 dark:bg-zinc-800 border border-white/20 dark:border-zinc-700 text-white text-xs rounded-lg px-2 py-1.5 cursor-pointer">
      <option value="es">🇪🇸 Español</option><option value="en">🇺🇸 English</option><option value="pt">🇧🇷 Português</option>
    </select>
    <button onclick="toggleTheme()" id="theme-toggle" class="w-8 h-8 rounded-lg bg-white/10 dark:bg-zinc-800 flex items-center justify-center text-white hover:bg-white/20 dark:hover:bg-zinc-700 transition-colors" title="Toggle Dark/Grey Mode">
      <i class="bi bi-moon-fill text-sm" id="theme-icon"></i>
    </button>
  </div>
</div>
</header>

<!-- ═══ TABS ═══ -->
<nav class="bg-slate-200/60 dark:bg-zinc-900/50 border-b border-slate-300 dark:border-zinc-800 overflow-x-auto">
<div class="max-w-7xl mx-auto px-4 flex gap-1">
  <button data-tab="executive" class="tab-btn flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 border-aura-500 text-aura-600 bg-aura-500/10 dark:text-aura-300 transition-colors whitespace-nowrap active"><i class="bi bi-file-earmark-text"></i><span data-i18n="tabExecutive">Resumen Ejecutivo</span></button>
  <button data-tab="overview" class="tab-btn flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap"><i class="bi bi-graph-up"></i><span data-i18n="tabOverview">Resultados Generales</span></button>
  <button data-tab="details" class="tab-btn flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap"><i class="bi bi-list-check"></i><span data-i18n="tabDetails">Detalle de Tests</span></button>
  ${coverageInfo ? `<button data-tab="coverage" class="tab-btn flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap"><i class="bi bi-bar-chart-line"></i><span data-i18n="tabCoverage">Cobertura</span></button>` : ''}
  <button data-tab="errors" class="tab-btn flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap"><i class="bi bi-exclamation-triangle"></i><span data-i18n="tabErrors">Logs de Error</span></button>
</div>
</nav>

<main class="max-w-7xl mx-auto px-4 py-6 space-y-6">

<!-- ═══ TAB: EXECUTIVE SUMMARY ═══ -->
<section id="tab-executive" class="tab-panel active">
<div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
  <div class="mb-4">
    <h2 class="text-xl font-bold text-slate-800 dark:text-white" data-i18n="executiveTitle">Resumen Ejecutivo</h2>
    <p class="text-xs text-slate-500 dark:text-gray-400 mt-1" data-i18n="executiveSubtitle">Resumen de pruebas unitarias con AI</p>
  </div>
  <div id="executive-summary-content" class="prose max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
    ${summaryHtmlByLang.es || '<p class="text-slate-400 dark:text-gray-500 italic" data-i18n="noSummary">Resumen ejecutivo no disponible. Configure PERPLEXITY_API_KEY para habilitar esta funcionalidad.</p>'}
  </div>
</div>
</section>

<!-- ═══ TAB: OVERVIEW ═══ -->
<section id="tab-overview" class="tab-panel">
  <!-- KPI Cards -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
    <div class="rounded-xl border p-4 bg-aura-50 dark:bg-aura-900/30 border-aura-200 dark:border-aura-800/50">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-collection text-aura-600 dark:text-aura-300 text-lg"></i><span class="text-xs font-medium text-aura-700 dark:text-aura-300" data-i18n="kpiTotal">Total</span></div>
      <p class="text-2xl font-bold text-slate-800 dark:text-white">${testInfo.total}</p>
    </div>
    <div class="rounded-xl border p-4 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-check-circle-fill text-emerald-600 dark:text-emerald-300 text-lg"></i><span class="text-xs font-medium text-emerald-700 dark:text-emerald-300" data-i18n="kpiPassed">Exitosos</span></div>
      <p class="text-2xl font-bold text-slate-800 dark:text-white">${testInfo.passed}</p>
    </div>
    <div class="rounded-xl border p-4 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/50">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-x-circle-fill text-red-600 dark:text-red-300 text-lg"></i><span class="text-xs font-medium text-red-700 dark:text-red-300" data-i18n="kpiFailed">Fallidos</span></div>
      <p class="text-2xl font-bold text-slate-800 dark:text-white">${testInfo.failed}</p>
    </div>
    <div class="rounded-xl border p-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-percent text-blue-600 dark:text-blue-300 text-lg"></i><span class="text-xs font-medium text-blue-700 dark:text-blue-300" data-i18n="kpiRate">Tasa de Éxito</span></div>
      <p class="text-2xl font-bold text-slate-800 dark:text-white">${passRate}%</p>
    </div>
    <div class="rounded-xl border p-4 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-skip-forward-circle text-amber-600 dark:text-amber-300 text-lg"></i><span class="text-xs font-medium text-amber-700 dark:text-amber-300" data-i18n="kpiSkipped">Omitidos</span></div>
      <p class="text-2xl font-bold text-slate-800 dark:text-white">${testInfo.skipped}</p>
    </div>
  </div>

  <!-- Charts -->
  <div class="grid md:grid-cols-2 gap-6 mb-6">
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-4" data-i18n="chartDistribution">Distribución de Tests</h3>
      <div class="flex justify-center"><canvas id="chart-donut" width="280" height="280"></canvas></div>
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-4" data-i18n="chartClasses">Resultados por Clase</h3>
      <canvas id="chart-bar" height="280"></canvas>
    </div>
  </div>

  <!-- Progress Bar -->
  <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400" data-i18n="overallProgress">Progreso General</h3>
      <span class="text-sm font-bold ${getPassRateTextClass(passRateNum)}">${passRate}%</span>
    </div>
    <div class="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
      <div class="h-full rounded-full transition-all duration-500 ${getPassRateBgClass(passRateNum)}" style="width:${passRate}%"></div>
    </div>
    <div class="flex justify-between mt-2 text-xs text-slate-400 dark:text-gray-500">
      <span>${testInfo.passed} <span data-i18n="lblPassed">exitosos</span></span>
      <span>${testInfo.failed} <span data-i18n="lblFailed">fallidos</span></span>
    </div>
  </div>
</section>

<!-- ═══ TAB: DETAILS ═══ -->
<section id="tab-details" class="tab-panel">
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-lg font-bold text-slate-700 dark:text-white"><span data-i18n="testClasses">Clases de Test</span> (${classEntries.length})</h2>
      <input type="text" id="search-tests" class="search-input bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-gray-300 w-64" placeholder="Buscar tests..." data-i18n-placeholder="searchTests" oninput="filterTests(this.value)">
    </div>
${classEntries.map(([className, tests], idx) => {
  const classPassed = tests.filter(t => t.outcome === 'Passed').length;
  const classFailed = tests.filter(t => t.outcome === 'Failed').length;
  const classRate = ((classPassed / tests.length) * 100).toFixed(1);
  return `
    <div class="suite-card bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      <button onclick="toggleAcc(this)" class="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg ${classFailed > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'} flex items-center justify-center">
            <i class="bi ${classFailed > 0 ? 'bi-x-lg text-red-600 dark:text-red-400' : 'bi-check-lg text-emerald-600 dark:text-emerald-400'} text-lg"></i>
          </div>
          <div class="text-left">
            <p class="text-sm font-semibold text-slate-800 dark:text-white suite-name">${esc(className)}</p>
            <p class="text-xs text-slate-400 dark:text-gray-500">${tests.length} tests</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">${classPassed} ✓</span>
          ${classFailed > 0 ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700">${classFailed} ✗</span>` : ''}
          <span class="text-xs font-mono text-slate-400 dark:text-gray-500">${classRate}%</span>
          <i class="bi bi-chevron-right acc-chevron text-slate-400 dark:text-gray-500"></i>
        </div>
      </button>
      <div class="acc-body">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 dark:bg-zinc-800/50"><tr>
            <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="colTest">Test</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="colStatus">Estado</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="colDuration">Duración</th>
          </tr></thead>
          <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/50">
${tests.map(t => {
  const isPassed = t.outcome === 'Passed';
  return `
            <tr class="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors test-row">
              <td class="px-4 py-3"><span class="text-slate-700 dark:text-gray-300 test-name-cell">${esc(t.name)}</span></td>
              <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold border ${isPassed ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'}">${t.outcome.toUpperCase()}</span></td>
              <td class="px-4 py-3 text-xs text-slate-400 dark:text-gray-500 font-mono">${formatDuration(t.duration)}</td>
            </tr>
${renderTestErrorRow(t)}`;
}).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}).join('')}
  </div>
</section>

${coverageInfo ? `
<!-- ═══ TAB: COVERAGE ═══ -->
<section id="tab-coverage" class="tab-panel">
  <!-- Coverage KPIs -->
  <div class="grid grid-cols-2 gap-4 mb-6">
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-3" data-i18n="lineCoverage">Cobertura de Líneas</h3>
      <div class="flex items-center gap-4">
        <p class="text-3xl font-bold ${getCoverageBadge(coverageInfo.lineRate)}">${coverageInfo.lineRate.toFixed(2)}%</p>
        <div class="flex-1">
          <div class="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
            <div class="h-full rounded-full ${getCoverageClass(coverageInfo.lineRate)}" style="width:${Math.min(coverageInfo.lineRate, 100)}%"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-3" data-i18n="branchCoverage">Cobertura de Ramas</h3>
      <div class="flex items-center gap-4">
        <p class="text-3xl font-bold ${getCoverageBadge(coverageInfo.branchRate)}">${coverageInfo.branchRate.toFixed(2)}%</p>
        <div class="flex-1">
          <div class="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
            <div class="h-full rounded-full ${getCoverageClass(coverageInfo.branchRate)}" style="width:${Math.min(coverageInfo.branchRate, 100)}%"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Coverage by Module -->
  <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm mb-6">
    <div class="p-4 border-b border-slate-200 dark:border-zinc-800">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400 flex items-center gap-2"><i class="bi bi-bar-chart-line"></i><span data-i18n="covByModule">Cobertura por Módulo</span></h3>
    </div>
    <table class="w-full text-sm">
      <thead class="bg-slate-50 dark:bg-zinc-800/50"><tr>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="colModule">Módulo</th>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="lineCoverage">Cobertura de Líneas</th>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="branchCoverage">Cobertura de Ramas</th>
      </tr></thead>
      <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/50">
${coverageInfo.packages.map(pkg => `
        <tr class="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
          <td class="px-4 py-3 font-medium text-slate-700 dark:text-gray-300">${esc(pkg.name)}</td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex-1 bg-slate-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div class="h-full rounded-full ${getCoverageClass(pkg.lineRate)}" style="width:${Math.min(pkg.lineRate, 100)}%"></div>
              </div>
              <span class="text-xs font-semibold ${getCoverageBadge(pkg.lineRate)} min-w-[50px] text-right">${pkg.lineRate.toFixed(2)}%</span>
            </div>
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex-1 bg-slate-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div class="h-full rounded-full ${getCoverageClass(pkg.branchRate)}" style="width:${Math.min(pkg.branchRate, 100)}%"></div>
              </div>
              <span class="text-xs font-semibold ${getCoverageBadge(pkg.branchRate)} min-w-[50px] text-right">${pkg.branchRate.toFixed(2)}%</span>
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- Coverage by File -->
${coverageInfo.packages.map(pkg => pkg.classes.length > 0 ? `
  <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm mb-4">
    <div class="p-4 border-b border-slate-200 dark:border-zinc-800">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400 flex items-center gap-2"><i class="bi bi-file-earmark-code"></i> ${esc(pkg.name)}</h3>
    </div>
    <table class="w-full text-sm">
      <thead class="bg-slate-50 dark:bg-zinc-800/50"><tr>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="colFile">Archivo</th>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="colLines">Líneas</th>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="lineCoverage">Cobertura de Líneas</th>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="branchCoverage">Cobertura de Ramas</th>
      </tr></thead>
      <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/50">
${pkg.classes.map(cls => `
        <tr class="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
          <td class="px-4 py-3"><code class="text-xs text-aura-600 dark:text-aura-400">${esc(cls.name)}</code></td>
          <td class="px-4 py-3 text-xs"><span class="text-emerald-600 dark:text-emerald-400 font-semibold">${cls.coveredLines}</span><span class="text-slate-400 dark:text-gray-500"> / ${cls.totalLines}</span></td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex-1 bg-slate-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div class="h-full rounded-full ${getCoverageClass(cls.lineRate)}" style="width:${Math.min(cls.lineRate, 100)}%"></div>
              </div>
              <span class="text-xs font-semibold ${getCoverageBadge(cls.lineRate)} min-w-[50px] text-right">${cls.lineRate.toFixed(2)}%</span>
            </div>
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex-1 bg-slate-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div class="h-full rounded-full ${getCoverageClass(cls.branchRate)}" style="width:${Math.min(cls.branchRate, 100)}%"></div>
              </div>
              <span class="text-xs font-semibold ${getCoverageBadge(cls.branchRate)} min-w-[50px] text-right">${cls.branchRate.toFixed(2)}%</span>
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : '').join('')}
</section>
` : ''}

<!-- ═══ TAB: ERRORS ═══ -->
<section id="tab-errors" class="tab-panel">
${failedTests.length === 0
  ? `<div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-10 text-center shadow-sm">
      <i class="bi bi-shield-check text-4xl text-emerald-400 mb-3 block"></i>
      <p class="text-slate-500 dark:text-gray-500" data-i18n="noErrors">No se registraron errores. ¡Excelente!</p>
    </div>`
  : `<div class="space-y-4">
      <div class="flex items-center gap-2 mb-2">
        <i class="bi bi-exclamation-triangle text-red-500"></i>
        <h2 class="text-lg font-bold text-slate-700 dark:text-white"><span data-i18n="errorCount">Tests Fallidos</span> (${failedTests.length})</h2>
      </div>
${failedTests.map(t => `
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-900/50 p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><i class="bi bi-x-lg text-red-600 dark:text-red-400"></i></div>
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-white">${esc(t.name)}</p>
            <p class="text-xs text-slate-400 dark:text-gray-500">${esc(t.className)} · ${formatDuration(t.duration)}</p>
          </div>
        </div>
        ${t.errorMessage ? `<div class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 mb-3">
          <p class="text-xs font-semibold text-red-800 dark:text-red-300 mb-1" data-i18n="errorMessage">Error</p>
          <p class="text-xs text-red-700 dark:text-red-400 font-mono break-all whitespace-pre-wrap max-h-32 overflow-y-auto">${esc(t.errorMessage)}</p>
        </div>` : ''}
        ${t.stackTrace ? `<details><summary class="text-xs text-slate-500 dark:text-gray-400 cursor-pointer hover:text-slate-700 dark:hover:text-gray-300" data-i18n="stackTrace">Stack Trace</summary>
          <pre class="mt-2 text-xs text-slate-500 dark:text-gray-500 font-mono bg-slate-100 dark:bg-zinc-800 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap">${esc(t.stackTrace)}</pre></details>` : ''}
      </div>`).join('')}
    </div>`}
</section>

</main>

<!-- ═══ FOOTER ═══ -->
<footer class="border-t border-slate-200 dark:border-zinc-800 mt-8 py-6 text-center text-xs text-slate-400 dark:text-gray-500">
  <p class="font-medium text-slate-500 dark:text-gray-400" data-i18n="footerMadeBy">Hecho por Applied AI Team — Stefanini</p>
  <p class="mt-1"><span data-i18n="generatedAt">Generado</span> ${new Date().toLocaleString('es-ES')}</p>
</footer>

<!-- ═══ SCRIPTS ═══ -->
<script>
const SUMMARY_HTML = ${summaryJson};

// ── Tabs ──
document.querySelectorAll('.tab-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById('tab-' + b.dataset.tab).classList.add('active');
  });
});

// ── Accordion ──
function toggleAcc(btn) {
  const body = btn.nextElementSibling;
  body.classList.toggle('open');
  btn.querySelector('.acc-chevron').classList.toggle('open');
}

// ── Theme Toggle ──
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  const icon = document.getElementById('theme-icon');
  if (document.documentElement.classList.contains('dark')) {
    icon.className = 'bi bi-sun-fill text-sm';
    localStorage.setItem('theme', 'dark');
  } else {
    icon.className = 'bi bi-moon-fill text-sm';
    localStorage.setItem('theme', 'grey');
  }
  updateChartColors();
}
(function() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.classList.add('dark');
    document.getElementById('theme-icon').className = 'bi bi-sun-fill text-sm';
  }
})();

// ── Search / Filter ──
function filterTests(q) {
  q = q.toLowerCase();
  document.querySelectorAll('.suite-card').forEach(card => {
    const name = card.querySelector('.suite-name')?.textContent?.toLowerCase() || '';
    const rows = card.querySelectorAll('.test-row');
    let anyVisible = false;
    rows.forEach(r => {
      const txt = r.querySelector('.test-name-cell')?.textContent?.toLowerCase() || '';
      const show = !q || txt.includes(q) || name.includes(q);
      r.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });
    card.style.display = (!q || anyVisible || name.includes(q)) ? '' : 'none';
  });
}

// ── Charts ──
const isDark = () => document.documentElement.classList.contains('dark');
const gridColor = () => isDark() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
const tickColor = () => isDark() ? '#6b7280' : '#94a3b8';

function updateChartColors() {
  if (window._donutChart) {
    window._donutChart.options.plugins.legend.labels.color = tickColor();
    window._donutChart.update();
  }
  if (window._barChart) {
    window._barChart.options.scales.x.ticks.color = tickColor();
    window._barChart.options.scales.y.ticks.color = tickColor();
    window._barChart.options.scales.y.grid.color = gridColor();
    window._barChart.update();
  }
}

const donutCtx = document.getElementById('chart-donut');
if (donutCtx) {
  window._donutChart = new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['Passed', 'Failed', 'Skipped'],
      datasets: [{
        data: [${testInfo.passed}, ${testInfo.failed}, ${testInfo.skipped}],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
        borderWidth: 0, borderRadius: 4
      }]
    },
    options: {
      responsive: false, cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { color: tickColor(), padding: 12, font: { size: 11, weight: '600' } } },
        tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.parsed + ' (' + ((ctx.parsed / ${testInfo.total}) * 100).toFixed(1) + '%)' } }
      }
    }
  });
}

const barCtx = document.getElementById('chart-bar');
if (barCtx) {
  const classNames = ${JSON.stringify(classEntries.map(([name]) => name.length > 30 ? '...' + name.slice(-27) : name))};
  const classPassed = ${JSON.stringify(classEntries.map(([, tests]) => tests.filter(t => t.outcome === 'Passed').length))};
  const classFailed = ${JSON.stringify(classEntries.map(([, tests]) => tests.filter(t => t.outcome === 'Failed').length))};
  window._barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: classNames,
      datasets: [
        { label: 'Passed', data: classPassed, backgroundColor: '#10b981', borderRadius: 4, barThickness: 20 },
        { label: 'Failed', data: classFailed, backgroundColor: '#ef4444', borderRadius: 4, barThickness: 20 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: tickColor(), font: { size: 11 } } } },
      scales: {
        x: { stacked: true, ticks: { color: tickColor(), font: { size: 9 } }, grid: { display: false } },
        y: { stacked: true, ticks: { color: tickColor() }, grid: { color: gridColor() } }
      }
    }
  });
}

// ── i18n ──
const i18n = {
es:{reportTitle:'Reporte de Pruebas Unitarias — Backend',tabExecutive:'Resumen Ejecutivo',tabOverview:'Resultados Generales',tabDetails:'Detalle de Tests',tabCoverage:'Cobertura',tabErrors:'Logs de Error',executiveTitle:'Resumen Ejecutivo',executiveSubtitle:'Resumen de pruebas unitarias con AI',noSummary:'Resumen ejecutivo no disponible. Configure PERPLEXITY_API_KEY para habilitar esta funcionalidad.',kpiTotal:'Total',kpiPassed:'Exitosos',kpiFailed:'Fallidos',kpiRate:'Tasa de Éxito',kpiSkipped:'Omitidos',chartDistribution:'Distribución de Tests',chartClasses:'Resultados por Clase',overallProgress:'Progreso General',lblPassed:'exitosos',lblFailed:'fallidos',testClasses:'Clases de Test',searchTests:'Buscar tests...',colTest:'Test',colStatus:'Estado',colDuration:'Duración',colModule:'Módulo',colFile:'Archivo',colLines:'Líneas',lineCoverage:'Cobertura de Líneas',branchCoverage:'Cobertura de Ramas',covByModule:'Cobertura por Módulo',noErrors:'No se registraron errores. ¡Excelente!',errorCount:'Tests Fallidos',errorMessage:'Error',stackTrace:'Stack Trace',footerMadeBy:'Hecho por Applied AI Team — Stefanini',generatedAt:'Generado'},
en:{reportTitle:'Unit Test Report — Backend',tabExecutive:'Executive Summary',tabOverview:'Overall Results',tabDetails:'Test Details',tabCoverage:'Coverage',tabErrors:'Error Logs',executiveTitle:'Executive Summary',executiveSubtitle:'Unit test summary with AI',noSummary:'Executive summary not available. Set PERPLEXITY_API_KEY to enable this feature.',kpiTotal:'Total',kpiPassed:'Passed',kpiFailed:'Failed',kpiRate:'Pass Rate',kpiSkipped:'Skipped',chartDistribution:'Test Distribution',chartClasses:'Results by Class',overallProgress:'Overall Progress',lblPassed:'passed',lblFailed:'failed',testClasses:'Test Classes',searchTests:'Search tests...',colTest:'Test',colStatus:'Status',colDuration:'Duration',colModule:'Module',colFile:'File',colLines:'Lines',lineCoverage:'Line Coverage',branchCoverage:'Branch Coverage',covByModule:'Coverage by Module',noErrors:'No errors recorded. Excellent!',errorCount:'Failed Tests',errorMessage:'Error',stackTrace:'Stack Trace',footerMadeBy:'Made by Applied AI Team — Stefanini',generatedAt:'Generated'},
pt:{reportTitle:'Relatório de Testes Unitários — Backend',tabExecutive:'Resumo Executivo',tabOverview:'Resultados Gerais',tabDetails:'Detalhes dos Testes',tabCoverage:'Cobertura',tabErrors:'Logs de Erro',executiveTitle:'Resumo Executivo',executiveSubtitle:'Resumo de testes unitários com IA',noSummary:'Resumo executivo não disponível. Configure PERPLEXITY_API_KEY para habilitar esta funcionalidade.',kpiTotal:'Total',kpiPassed:'Aprovados',kpiFailed:'Falhos',kpiRate:'Taxa de Sucesso',kpiSkipped:'Omitidos',chartDistribution:'Distribuição de Testes',chartClasses:'Resultados por Classe',overallProgress:'Progresso Geral',lblPassed:'aprovados',lblFailed:'falhos',testClasses:'Classes de Teste',searchTests:'Buscar testes...',colTest:'Teste',colStatus:'Status',colDuration:'Duração',colModule:'Módulo',colFile:'Arquivo',colLines:'Linhas',lineCoverage:'Cobertura de Linhas',branchCoverage:'Cobertura de Branches',covByModule:'Cobertura por Módulo',noErrors:'Nenhum erro registrado. Excelente!',errorCount:'Testes com Falha',errorMessage:'Erro',stackTrace:'Stack Trace',footerMadeBy:'Feito por Applied AI Team — Stefanini',generatedAt:'Gerado'}
};

function renderExecutiveSummary(lang) {
  const container = document.getElementById('executive-summary-content');
  if (!container) return;
  const html = SUMMARY_HTML[lang] || SUMMARY_HTML.en || '';
  if (html && html.trim()) {
    container.innerHTML = html;
  } else {
    const t = i18n[lang] || i18n.es;
    container.innerHTML = '<p class="text-slate-400 dark:text-gray-500 italic">' + (t.noSummary || 'Summary unavailable') + '</p>';
  }
}

function switchLang(l) {
  const t = i18n[l] || i18n.es;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (t[k]) el.textContent = t[k];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.getAttribute('data-i18n-placeholder');
    if (t[k]) el.placeholder = t[k];
  });
  document.documentElement.lang = l;
  renderExecutiveSummary(l);
}
switchLang(document.getElementById('lang-select')?.value || 'es');
</script>
</body>
</html>`;
}

// ─── Markdown Report ──────────────────────────────────────────────────────────

function generateMarkdownReport(testInfo, coverageInfo) {
  const passRate = testInfo.total > 0 ? ((testInfo.passed / testInfo.total) * 100).toFixed(2) : '0';
  let md = `## Backend Unit Tests (.NET 8 / xUnit) Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| **Total Tests** | ${testInfo.total} |\n`;
  md += `| **Passed** | ${testInfo.passed} |\n`;
  md += `| **Failed** | ${testInfo.failed} |\n`;
  md += `| **Skipped** | ${testInfo.skipped} |\n`;
  md += `| **Pass Rate** | ${passRate}% |\n\n`;

  if (coverageInfo) {
    md += `## Coverage Summary\n\n`;
    md += `| Module | Line Coverage | Branch Coverage |\n`;
    md += `|--------|---------------|----------------|\n`;
    coverageInfo.packages.forEach(pkg => {
      md += `| **${pkg.name}** | ${pkg.lineRate.toFixed(2)}% | ${pkg.branchRate.toFixed(2)}% |\n`;
    });
    md += `\n`;
  }

  md += `> Download artifact **backend-unit-test-results** for the complete report with per-test details.\n`;
  return md;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

try {
  console.log('Generating backend unit test report...\n');

  console.log('Parsing TRX file...');
  const trxData = await parseTrxFile();

  console.log('Extracting test information...');
  const testInfo = extractTestInfo(trxData);

  console.log('Parsing coverage file...');
  const coberturaData = await parseCoberturaFile();
  const coverageInfo = extractCoverageInfo(coberturaData);

  console.log(`\nStats: Total=${testInfo.total}, Passed=${testInfo.passed}, Failed=${testInfo.failed}, Skipped=${testInfo.skipped}`);
  if (coverageInfo) {
    console.log(`Coverage: Lines=${coverageInfo.lineRate.toFixed(2)}%, Branches=${coverageInfo.branchRate.toFixed(2)}%`);
  }

  console.log('\nGenerating AI executive summary...');
  const summaryByLang = await generateExecutiveSummary(testInfo, coverageInfo);

  console.log('\nGenerating HTML report...');
  const htmlReport = generateHtmlReport(testInfo, coverageInfo, summaryByLang);
  fs.writeFileSync(HTML_REPORT_PATH, htmlReport, 'utf-8');
  console.log(`  HTML report: ${HTML_REPORT_PATH}`);

  console.log('\nGenerating Markdown report...');
  const markdownReport = generateMarkdownReport(testInfo, coverageInfo);
  fs.writeFileSync(MARKDOWN_REPORT_PATH, markdownReport, 'utf-8');
  console.log(`  Markdown report: ${MARKDOWN_REPORT_PATH}`);

  console.log('\nReports generated successfully.\n');
  process.exit(testInfo.failed > 0 ? 1 : 0);
} catch (error) {
  console.error('Failed to generate reports:', error);
  process.exit(1);
}
