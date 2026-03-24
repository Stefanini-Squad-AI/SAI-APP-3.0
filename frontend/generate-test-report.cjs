#!/usr/bin/env node

/**
 * Frontend Unit Test Report Generator — AURA Style
 *
 * Reads Jest junit.xml and produces:
 *   - test-report.html  (TailwindCSS, i18n ES/EN/PT, Dark/Grey Mode, Perplexity AI Executive Summary)
 *   - test-report.md    (Markdown summary)
 *
 * Environment variables (optional):
 *   MODEL_PROVIDER      — perplexity | openai (default: perplexity); alineado con raíz .env
 *   PERPLEXITY_API_KEY / PERPLEXITY_MODEL — resumen ejecutivo
 *   OPENAI_API_KEY / OPENAI_MODEL — alternativa OpenAI
 *   FRONTEND_EXEC_SUMMARY_MAX_TOKENS — salida LLM (1024–32000, default 8192)
 *
 * Cobertura: ejecutar antes `npm run test:coverage` para generar coverage/cobertura-coverage.xml
 */

const fs = require('fs');
const path = require('path');
const { parseStringPromise } = require('xml2js');

try { require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') }); } catch {}
try { require('dotenv').config({ path: path.resolve(__dirname, '.env') }); } catch {}

const JUNIT_XML_PATH = path.join(__dirname, 'test-results/jest/junit.xml');
const COBERTURA_XML_PATH = path.join(__dirname, 'coverage/cobertura-coverage.xml');
const OUTPUT_HTML_PATH = path.join(__dirname, 'test-results/jest/test-report.html');
const OUTPUT_MARKDOWN_PATH = path.join(__dirname, 'test-results/jest/test-report.md');

// ─── XML Parsing ──────────────────────────────────────────────────────────────

async function parseJunitXml() {
  const xmlContent = fs.readFileSync(JUNIT_XML_PATH, 'utf-8');
  return parseStringPromise(xmlContent);
}

function extractStats(parsedXml) {
  const ts = parsedXml.testsuites;
  const total = parseInt(ts.$.tests) || 0;
  const failures = parseInt(ts.$.failures) || 0;
  const errors = parseInt(ts.$.errors) || 0;
  return {
    total,
    failures,
    errors,
    passed: total - failures - errors,
    skipped: 0,
    time: parseFloat(ts.$.time) || 0,
    timestamp: new Date().toISOString(),
  };
}

function extractTestSuites(parsedXml) {
  return (parsedXml.testsuites.testsuite || []).map(suite => {
    const cases = suite.testcase || [];
    return {
      name: suite.$.name,
      tests: parseInt(suite.$.tests) || 0,
      failures: parseInt(suite.$.failures) || 0,
      errors: parseInt(suite.$.errors) || 0,
      skipped: parseInt(suite.$.skipped) || 0,
      time: parseFloat(suite.$.time) || 0,
      testcases: cases.map(tc => ({
        classname: tc.$.classname,
        name: tc.$.name,
        time: parseFloat(tc.$.time) || 0,
        status: tc.failure ? 'failed' : tc.error ? 'error' : 'passed',
        failure: tc.failure ? tc.failure[0]._ || tc.failure[0] : null,
      })),
    };
  });
}

// ─── Code coverage (Jest cobertura XML) ───────────────────────────────────────

function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * @returns {null | {
 *   lineRate: number, branchRate: number, linesValid: number, linesCovered: number,
 *   packages: Array<{ name: string, lineRate: number, branchRate: number,
 *     classes: Array<{ name: string, filename: string, lineRate: number, branchRate: number,
 *       totalLines: number, coveredLines: number, uncoveredLines: number }> }>,
 *   totalSourceFiles: number, filesWithNoLineCoverage: number
 * }}
 */
function extractFrontendCoverageInfo(coberturaData) {
  if (!coberturaData?.coverage) return null;
  const cov = coberturaData.coverage;
  const root = cov.$ || {};
  const lineRate = Number.parseFloat(String(root['line-rate'] ?? 0)) * 100;
  const branchRate = Number.parseFloat(String(root['branch-rate'] ?? 0)) * 100;
  const linesValid = Number.parseInt(String(root['lines-valid'] ?? 0), 10) || 0;
  const linesCovered = Number.parseInt(String(root['lines-covered'] ?? 0), 10) || 0;

  let pkgArr = cov.packages?.[0]?.package;
  if (pkgArr == null && cov.packages?.package != null) pkgArr = cov.packages.package;
  const packages = asArray(pkgArr).map((pkg) => {
    const pkgLineRate = Number.parseFloat(String(pkg.$?.['line-rate'] ?? 0)) * 100;
    const pkgBranchRate = Number.parseFloat(String(pkg.$?.['branch-rate'] ?? 0)) * 100;
    let clsArr = pkg.classes?.[0]?.class;
    if (clsArr == null && pkg.classes?.class != null) clsArr = pkg.classes.class;
    const classes = asArray(clsArr).map((cls) => {
      const lines = asArray(cls.lines?.[0]?.line ?? cls.lines?.line);
      const totalLines = lines.length;
      const coveredLines = lines.filter((l) => Number.parseInt(String(l.$?.hits ?? 0), 10) > 0).length;
      return {
        name: cls.$?.name || 'Unknown',
        filename: cls.$?.filename || '',
        lineRate: Number.parseFloat(String(cls.$?.['line-rate'] ?? 0)) * 100,
        branchRate: Number.parseFloat(String(cls.$?.['branch-rate'] ?? 0)) * 100,
        totalLines,
        coveredLines,
        uncoveredLines: totalLines - coveredLines,
      };
    });
    return { name: pkg.$?.name || 'Unknown', lineRate: pkgLineRate, branchRate: pkgBranchRate, classes };
  });

  let totalSourceFiles = 0;
  let filesWithNoLineCoverage = 0;
  for (const p of packages) {
    for (const c of p.classes) {
      totalSourceFiles++;
      if (c.totalLines > 0 && c.coveredLines === 0) filesWithNoLineCoverage++;
    }
  }

  return {
    lineRate,
    branchRate,
    linesValid,
    linesCovered,
    packages,
    totalSourceFiles,
    filesWithNoLineCoverage,
  };
}

async function loadCoverageInfo() {
  if (!fs.existsSync(COBERTURA_XML_PATH)) {
    console.warn(`  Cobertura XML not found (${COBERTURA_XML_PATH}). Run: npm run test:coverage`);
    return null;
  }
  try {
    const xml = fs.readFileSync(COBERTURA_XML_PATH, 'utf-8');
    const parsed = await parseStringPromise(xml);
    const info = extractFrontendCoverageInfo(parsed);
    if (info) {
      console.log(`  Coverage: lines=${info.lineRate.toFixed(2)}%, branches=${info.branchRate.toFixed(2)}%, files=${info.totalSourceFiles}, archivos con 0 líneas cubiertas=${info.filesWithNoLineCoverage}`);
    }
    return info;
  } catch (e) {
    console.warn(`  Failed to parse cobertura XML: ${e.message}`);
    return null;
  }
}

// ─── LLM executive summary (MODEL_PROVIDER: perplexity | openai) ───────────

/** Limpia artefactos del modelo (citas [1], bloques ```, emojis) del Markdown del resumen. */
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

function resolveExecMaxTokens() {
  const n = Number.parseInt(process.env.FRONTEND_EXEC_SUMMARY_MAX_TOKENS || '8192', 10);
  if (Number.isFinite(n) && n >= 1024 && n <= 32000) return n;
  return 8192;
}

async function callExecutiveLLM(systemPrompt, userPrompt) {
  const maxTok = resolveExecMaxTokens();
  const provider = (process.env.MODEL_PROVIDER || 'perplexity').toLowerCase();

  const tryPerplexity = async () => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey || apiKey.startsWith('your_')) return null;
    const model = process.env.PERPLEXITY_MODEL || 'sonar';
    console.log(`  Calling Perplexity (model: ${model}, max_tokens=${maxTok})...`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: maxTok,
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
      console.warn(`  Perplexity error: ${response.status} — ${errText}`);
      return null;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    console.log(`  AI response (${data.usage?.total_tokens ?? '?'} tokens).`);
    return content;
  };

  const tryOpenAI = async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.startsWith('your_')) return null;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    console.log(`  Calling OpenAI (model: ${model}, max_tokens=${maxTok})...`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: maxTok,
        temperature: 0.35,
        response_format: { type: 'json_object' },
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
      console.warn(`  OpenAI error: ${response.status} — ${errText}`);
      return null;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    console.log(`  AI response (${data.usage?.total_tokens ?? '?'} tokens).`);
    return content;
  };

  try {
    if (provider === 'openai') {
      const c = await tryOpenAI();
      if (c) return c;
      const c2 = await tryPerplexity();
      if (c2) return c2;
    } else {
      const c = await tryPerplexity();
      if (c) return c;
      const c2 = await tryOpenAI();
      if (c2) return c2;
    }
  } catch (err) {
    console.warn(`  LLM call failed: ${err?.message ?? String(err)}`);
  }
  console.log('  No LLM API key / call failed — skipping AI executive summary.');
  return '';
}

async function generateExecutiveSummary(stats, testSuites, coverageInfo) {
  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : '0';

  const suiteSummary = testSuites.map((s) => {
    const sp = s.tests - s.failures;
    return `  - ${s.name}: ${s.tests} tests, ${sp} passed, ${s.failures} failed`;
  }).join('\n');

  const failedTests = testSuites
    .flatMap((s) => s.testcases.filter((t) => t.status === 'failed').map((t) => `  - [${s.name}] ${t.name}`))
    .join('\n');

  const coverageBlock = coverageInfo
    ? `Code coverage (instrumented source files under collectCoverageFrom):
  Line coverage: ${coverageInfo.lineRate.toFixed(2)}%
  Branch coverage: ${coverageInfo.branchRate.toFixed(2)}%
  Lines: ${coverageInfo.linesCovered} covered / ${coverageInfo.linesValid} valid (tracked)
  Source files in report: ${coverageInfo.totalSourceFiles}
  Files with ~0% line coverage: ${coverageInfo.filesWithNoLineCoverage}`
    : 'Code coverage: not available (run npm run test:coverage before test:report).';

  const systemPrompt = `You are a senior QA / engineering lead writing a structured EXECUTIVE UNIT-TEST REPORT for React/Jest (frontend).
Output Markdown only inside JSON string values (no HTML). For EACH language use the SAME outline and depth.

Style and audience:
- Explain at a high level in clear, professional prose. Readers may not be deeply technical: define acronyms once, avoid jargon dumps, connect numbers to business impact.
- Be substantive: each section should add real insight from the data (not filler).
- Do NOT use emojis, symbols as bullets, decorative icons, or numeric reference markers like [1] or [12].
- Do NOT include fenced code blocks (\`\`\`), inline code snippets of config files, file paths in backticks, or pasted JSON.
- Use ## for the 10 main sections. Under "Hallazgos" / "Findings" / "Achados" use exactly these three ### subsections.
- Use bullet lists (- item) where helpful.
- Avoid raw stack traces; paraphrase failure themes.
- Historical trend: usually single run — state explicitly if no prior data.
- Glossary: 4–8 plain-language terms (unit test, suite, line/branch coverage, etc.) in the target language.

Return ONLY valid JSON (no markdown fences):
{"en":"<markdown>","es":"<markdown>","pt":"<markdown>"}

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

  const userPrompt = `Frontend unit tests (Jest + React Testing Library):

Project: TuCreditoOnline — Frontend
Total tests: ${stats.total}
Passed: ${stats.passed}
Failed: ${stats.failures}
Pass rate: ${passRate}%
Duration: ${stats.time.toFixed(2)}s
Date: ${new Date().toISOString()}

${coverageBlock}

Test suites:
${suiteSummary}

${failedTests ? `Failed tests:\n${failedTests}` : 'No failed tests.'}

Mention explicitly the gap between "tests ejecutados" and "código fuente sin cubrir" using the coverage file counts when available.`;

  const content = await callExecutiveLLM(systemPrompt, userPrompt);
  if (!content) return { en: '', es: '', pt: '' };
  const parsed = parseSummaryJson(content);
  if (parsed) return sanitizeExecutiveSummaryByLang(parsed);
  return sanitizeExecutiveSummaryByLang({ en: content.trim(), es: content.trim(), pt: content.trim() });
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

// ─── Markdown to HTML (executive summary — headings ## / ###, lists) ─────────

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

// ─── HTML Report Generation ───────────────────────────────────────────────────

function generateHtmlReport(stats, testSuites, summaryByLang, coverageInfo) {
  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : '0';
  const passRateNum = Number.parseFloat(passRate);
  const linesUncovered = coverageInfo ? Math.max(0, coverageInfo.linesValid - coverageInfo.linesCovered) : 0;

  const summaryHtmlByLang = {
    en: mdToHtml(summaryByLang.en),
    es: mdToHtml(summaryByLang.es),
    pt: mdToHtml(summaryByLang.pt),
  };
  const summaryJson = JSON.stringify(summaryHtmlByLang).replace(/<\/script/g, '<\\/script');

  const failedTests = testSuites.flatMap(s =>
    s.testcases.filter(t => t.status === 'failed').map(t => ({ suite: s.name, ...t }))
  );

  return `<!DOCTYPE html>
<html lang="es" class="">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Frontend Unit Test Report — TuCreditoOnline</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"><\/script>
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
<\/script>
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
      <h1 class="text-lg font-bold text-white leading-tight" data-i18n="reportTitle">Reporte de Pruebas Unitarias — Frontend</h1>
      <p class="text-xs text-white/70">TuCreditoOnline · React + Jest · ${new Date().toLocaleDateString('es-ES')}</p>
    </div>
  </div>
  <div class="flex items-center gap-3">
    <span class="px-3 py-1 rounded-full text-xs font-bold ${stats.failures === 0
      ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/50'
      : 'bg-red-500/20 text-red-100 border border-red-400/50'}">${stats.failures === 0 ? 'ALL PASSED' : stats.failures + ' FAILED'}</span>
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
    ${summaryHtmlByLang.es || '<p class="text-slate-400 dark:text-gray-500 italic" data-i18n="noSummary">Resumen ejecutivo no disponible. Configure PERPLEXITY_API_KEY u OPENAI_API_KEY según MODEL_PROVIDER.</p>'}
  </div>
</div>
</section>

<!-- ═══ TAB: OVERVIEW ═══ -->
<section id="tab-overview" class="tab-panel">
  <!-- KPI Cards -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
    <div class="rounded-xl border p-4 bg-aura-50 dark:bg-aura-900/30 border-aura-200 dark:border-aura-800/50">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-collection text-aura-600 dark:text-aura-300 text-lg"></i><span class="text-xs font-medium text-aura-700 dark:text-aura-300" data-i18n="kpiTotal">Total</span></div>
      <p class="text-2xl font-bold text-slate-800 dark:text-white">${stats.total}</p>
    </div>
    <div class="rounded-xl border p-4 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-check-circle-fill text-emerald-600 dark:text-emerald-300 text-lg"></i><span class="text-xs font-medium text-emerald-700 dark:text-emerald-300" data-i18n="kpiPassed">Exitosos</span></div>
      <p class="text-2xl font-bold text-slate-800 dark:text-white">${stats.passed}</p>
    </div>
    <div class="rounded-xl border p-4 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/50">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-x-circle-fill text-red-600 dark:text-red-300 text-lg"></i><span class="text-xs font-medium text-red-700 dark:text-red-300" data-i18n="kpiFailed">Fallidos</span></div>
      <p class="text-2xl font-bold text-slate-800 dark:text-white">${stats.failures}</p>
    </div>
    <div class="rounded-xl border p-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-percent text-blue-600 dark:text-blue-300 text-lg"></i><span class="text-xs font-medium text-blue-700 dark:text-blue-300" data-i18n="kpiRate">Tasa de Éxito</span></div>
      <p class="text-2xl font-bold text-slate-800 dark:text-white">${passRate}%</p>
    </div>
    <div class="rounded-xl border p-4 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-clock text-amber-600 dark:text-amber-300 text-lg"></i><span class="text-xs font-medium text-amber-700 dark:text-amber-300" data-i18n="kpiDuration">Duración</span></div>
      <p class="text-2xl font-bold text-slate-800 dark:text-white">${stats.time.toFixed(2)}s</p>
    </div>
  </div>

  ${coverageInfo ? `
  <div class="mb-2 mt-2">
    <h3 class="text-sm font-semibold text-slate-600 dark:text-gray-300" data-i18n="codeCoverageTitle">Cobertura de código (Jest)</h3>
    <p class="text-xs text-slate-500 dark:text-gray-500" data-i18n="codeCoverageHint">Porcentaje sobre líneas/ramas instrumentadas (collectCoverageFrom). Ejecute <code class="text-violet-600 dark:text-violet-400">npm run test:coverage</code> antes del informe.</p>
  </div>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div class="rounded-xl border p-4 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/50">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-code-slash text-teal-600 dark:text-teal-300 text-lg"></i><span class="text-xs font-medium text-teal-800 dark:text-teal-300" data-i18n="covLinePct">Cobertura líneas</span></div>
      <p class="text-2xl font-bold ${getCoverageBadge(coverageInfo.lineRate)}">${coverageInfo.lineRate.toFixed(2)}%</p>
    </div>
    <div class="rounded-xl border p-4 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/50">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-diagram-3 text-cyan-600 dark:text-cyan-300 text-lg"></i><span class="text-xs font-medium text-cyan-800 dark:text-cyan-300" data-i18n="covBranchPct">Cobertura ramas</span></div>
      <p class="text-2xl font-bold ${getCoverageBadge(coverageInfo.branchRate)}">${coverageInfo.branchRate.toFixed(2)}%</p>
    </div>
    <div class="rounded-xl border p-4 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-zinc-700">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-files text-slate-600 dark:text-slate-300 text-lg"></i><span class="text-xs font-medium text-slate-700 dark:text-slate-300" data-i18n="covFilesTracked">Archivos en alcance</span></div>
      <p class="text-2xl font-bold text-slate-800 dark:text-white">${coverageInfo.totalSourceFiles}</p>
    </div>
    <div class="rounded-xl border p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50">
      <div class="flex items-center gap-2 mb-2"><i class="bi bi-file-earmark-x text-orange-600 dark:text-orange-300 text-lg"></i><span class="text-xs font-medium text-orange-800 dark:text-orange-300" data-i18n="covFilesNoLines">Sin cubrir líneas (~0%)</span></div>
      <p class="text-2xl font-bold text-slate-800 dark:text-white">${coverageInfo.filesWithNoLineCoverage}</p>
    </div>
  </div>` : ''}

  <!-- Charts -->
  <div class="grid md:grid-cols-${coverageInfo ? '3' : '2'} gap-6 mb-6">
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-4" data-i18n="chartDistribution">Distribución de Tests</h3>
      <div class="flex justify-center"><canvas id="chart-donut" width="260" height="260"></canvas></div>
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-4" data-i18n="chartSuites">Resultados por Suite</h3>
      <canvas id="chart-bar" height="260"></canvas>
    </div>
    ${coverageInfo ? `
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-4" data-i18n="chartLinesCov">Líneas cubiertas vs no cubiertas</h3>
      <div class="flex justify-center"><canvas id="chart-lines-cov" width="260" height="260"></canvas></div>
      <p class="text-xs text-center text-slate-400 dark:text-gray-500 mt-2">${coverageInfo.linesCovered} / ${coverageInfo.linesValid} <span data-i18n="covLinesLabel">líneas</span></p>
    </div>` : ''}
  </div>

  <!-- Progress Bar -->
  <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400" data-i18n="overallProgress">Progreso General</h3>
      <span class="text-sm font-bold ${passRateNum >= 80 ? 'text-emerald-600 dark:text-emerald-400' : passRateNum >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}">${passRate}%</span>
    </div>
    <div class="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
      <div class="h-full rounded-full transition-all duration-500 ${passRateNum >= 80 ? 'bg-emerald-500' : passRateNum >= 50 ? 'bg-amber-500' : 'bg-red-500'}" style="width:${passRate}%"></div>
    </div>
    <div class="flex justify-between mt-2 text-xs text-slate-400 dark:text-gray-500">
      <span>${stats.passed} <span data-i18n="lblPassed">exitosos</span></span>
      <span>${stats.failures} <span data-i18n="lblFailed">fallidos</span></span>
    </div>
  </div>
</section>

${coverageInfo ? `
<!-- ═══ TAB: COVERAGE ═══ -->
<section id="tab-coverage" class="tab-panel">
  <div class="grid grid-cols-2 gap-4 mb-6">
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-3" data-i18n="lineCoverage">Cobertura de líneas</h3>
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
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-3" data-i18n="branchCoverage">Cobertura de ramas</h3>
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

  <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm mb-6">
    <div class="p-4 border-b border-slate-200 dark:border-zinc-800">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400 flex items-center gap-2"><i class="bi bi-bar-chart-line"></i><span data-i18n="covByPackage">Cobertura por paquete</span></h3>
    </div>
    <table class="w-full text-sm">
      <thead class="bg-slate-50 dark:bg-zinc-800/50"><tr>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="colPackage">Paquete</th>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="lineCoverage">Líneas</th>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="branchCoverage">Ramas</th>
      </tr></thead>
      <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/50">
${coverageInfo.packages.map((pkg) => `
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

${coverageInfo.packages.map((pkg) => (pkg.classes.length > 0 ? `
  <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm mb-4">
    <div class="p-4 border-b border-slate-200 dark:border-zinc-800">
      <h3 class="text-sm font-semibold text-slate-500 dark:text-gray-400 flex items-center gap-2"><i class="bi bi-file-earmark-code"></i> ${esc(pkg.name)}</h3>
    </div>
    <table class="w-full text-sm">
      <thead class="bg-slate-50 dark:bg-zinc-800/50"><tr>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="colFile">Archivo</th>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="colLinesHit">Líneas cubiertas</th>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="lineCoverage">Líneas %</th>
        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-gray-400" data-i18n="branchCoverage">Ramas %</th>
      </tr></thead>
      <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/50">
${pkg.classes.map((cls) => `
        <tr class="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
          <td class="px-4 py-3"><code class="text-xs text-violet-600 dark:text-violet-400">${esc(cls.name)}</code><div class="text-[10px] text-slate-400 truncate max-w-xs">${esc(cls.filename)}</div></td>
          <td class="px-4 py-3 text-xs"><span class="text-emerald-600 dark:text-emerald-400 font-semibold">${cls.coveredLines}</span><span class="text-slate-400 dark:text-gray-500"> / ${cls.totalLines}</span></td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-slate-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden min-w-[60px]">
                <div class="h-full rounded-full ${getCoverageClass(cls.lineRate)}" style="width:${Math.min(cls.lineRate, 100)}%"></div>
              </div>
              <span class="text-xs font-semibold ${getCoverageBadge(cls.lineRate)}">${cls.lineRate.toFixed(1)}%</span>
            </div>
          </td>
          <td class="px-4 py-3">
            <span class="text-xs font-semibold ${getCoverageBadge(cls.branchRate)}">${cls.branchRate.toFixed(1)}%</span>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : '')).join('')}
</section>
` : ''}

<!-- ═══ TAB: DETAILS ═══ -->
<section id="tab-details" class="tab-panel">
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-lg font-bold text-slate-700 dark:text-white"><span data-i18n="testSuites">Test Suites</span> (${testSuites.length})</h2>
      <input type="text" id="search-tests" class="search-input bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-gray-300 w-64" placeholder="Buscar tests..." data-i18n-placeholder="searchTests" oninput="filterTests(this.value)">
    </div>
${testSuites.map((suite, idx) => {
  const sp = suite.tests - suite.failures;
  const sRate = suite.tests > 0 ? ((sp / suite.tests) * 100).toFixed(1) : '0';
  return `
    <div class="suite-card bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      <button onclick="toggleAcc(this)" class="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg ${suite.failures > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'} flex items-center justify-center">
            <i class="bi ${suite.failures > 0 ? 'bi-x-lg text-red-600 dark:text-red-400' : 'bi-check-lg text-emerald-600 dark:text-emerald-400'} text-lg"></i>
          </div>
          <div class="text-left">
            <p class="text-sm font-semibold text-slate-800 dark:text-white suite-name">${esc(suite.name)}</p>
            <p class="text-xs text-slate-400 dark:text-gray-500">${suite.tests} tests · ${suite.time.toFixed(2)}s</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">${sp} ✓</span>
          ${suite.failures > 0 ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700">${suite.failures} ✗</span>` : ''}
          <span class="text-xs font-mono text-slate-400 dark:text-gray-500">${sRate}%</span>
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
${suite.testcases.map(tc => `
            <tr class="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors test-row">
              <td class="px-4 py-3"><span class="text-slate-700 dark:text-gray-300 test-name-cell">${esc(tc.name)}</span></td>
              <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold border ${tc.status === 'passed' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'}">${tc.status.toUpperCase()}</span></td>
              <td class="px-4 py-3 text-xs text-slate-400 dark:text-gray-500 font-mono">${(tc.time * 1000).toFixed(0)}ms</td>
            </tr>
${tc.failure ? `
            <tr class="bg-red-50 dark:bg-red-950/20">
              <td colspan="3" class="px-4 py-3">
                <div class="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg p-3">
                  <p class="text-xs text-red-700 dark:text-red-400 font-mono break-all whitespace-pre-wrap max-h-48 overflow-y-auto">${esc(String(tc.failure))}</p>
                </div>
              </td>
            </tr>` : ''}`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}).join('')}
  </div>
</section>

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
            <p class="text-xs text-slate-400 dark:text-gray-500">${esc(t.suite)} · ${(t.time * 1000).toFixed(0)}ms</p>
          </div>
        </div>
        ${t.failure ? `<div class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
          <p class="text-xs text-red-700 dark:text-red-400 font-mono break-all whitespace-pre-wrap max-h-64 overflow-y-auto">${esc(String(t.failure))}</p>
        </div>` : ''}
      </div>`).join('')}
    </div>`}
</section>

</main>

<!-- ═══ FOOTER ═══ -->
<footer class="border-t border-slate-200 dark:border-zinc-800 mt-8 py-6 text-center text-xs text-slate-400 dark:text-gray-500">
  <p class="font-medium text-slate-500 dark:text-gray-400" data-i18n="footerMadeBy">Hecho por Applied AI Team — Stefanini</p>
  <p class="mt-1"><span data-i18n="generatedAt">Generado</span> ${new Date().toLocaleString('es-ES')} · <span data-i18n="totalDuration">Duración total</span>: ${stats.time.toFixed(2)}s</p>
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
  if (window._linesCovChart) {
    window._linesCovChart.options.plugins.legend.labels.color = tickColor();
    window._linesCovChart.update();
  }
}

const donutCtx = document.getElementById('chart-donut');
if (donutCtx) {
  window._donutChart = new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['Passed', 'Failed'],
      datasets: [{
        data: [${stats.passed}, ${stats.failures}],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0, borderRadius: 4
      }]
    },
    options: {
      responsive: false, cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { color: tickColor(), padding: 12, font: { size: 11, weight: '600' } } },
        tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.parsed + ' (' + ((ctx.parsed / ${stats.total}) * 100).toFixed(1) + '%)' } }
      }
    }
  });
}

const barCtx = document.getElementById('chart-bar');
if (barCtx) {
  const suiteNames = ${JSON.stringify(testSuites.map(s => s.name.length > 25 ? s.name.slice(0, 22) + '...' : s.name))};
  const suitePassed = ${JSON.stringify(testSuites.map(s => s.tests - s.failures))};
  const suiteFailed = ${JSON.stringify(testSuites.map(s => s.failures))};
  window._barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: suiteNames,
      datasets: [
        { label: 'Passed', data: suitePassed, backgroundColor: '#10b981', borderRadius: 4, barThickness: 20 },
        { label: 'Failed', data: suiteFailed, backgroundColor: '#ef4444', borderRadius: 4, barThickness: 20 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: tickColor(), font: { size: 11 } } } },
      scales: {
        x: { stacked: true, ticks: { color: tickColor() }, grid: { display: false } },
        y: { stacked: true, ticks: { color: tickColor() }, grid: { color: gridColor() } }
      }
    }
  });
}

${coverageInfo ? `
const linesCovEl = document.getElementById('chart-lines-cov');
if (linesCovEl) {
  const covC = ${coverageInfo.linesCovered};
  const covU = ${linesUncovered};
  window._linesCovChart = new Chart(linesCovEl, {
    type: 'doughnut',
    data: {
      labels: ['Covered', 'Uncovered'],
      datasets: [{
        data: [covC, covU],
        backgroundColor: ['#14b8a6', '#64748b'],
        borderWidth: 0,
        borderRadius: 4
      }]
    },
    options: {
      responsive: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { color: tickColor(), padding: 10, font: { size: 10, weight: '600' } } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const t = covC + covU;
              const pct = t ? ((ctx.parsed / t) * 100).toFixed(1) : '0';
              return ctx.label + ': ' + ctx.parsed + ' (' + pct + '%)';
            }
          }
        }
      }
    }
  });
}` : ''}

// ── i18n ──
const i18n = {
es:{reportTitle:'Reporte de Pruebas Unitarias — Frontend',tabExecutive:'Resumen Ejecutivo',tabOverview:'Resultados Generales',tabDetails:'Detalle de Tests',tabCoverage:'Cobertura',tabErrors:'Logs de Error',executiveTitle:'Resumen Ejecutivo',executiveSubtitle:'Resumen de pruebas unitarias con AI',noSummary:'Resumen no disponible. Configure PERPLEXITY_API_KEY u OPENAI_API_KEY según MODEL_PROVIDER.',kpiTotal:'Total',kpiPassed:'Exitosos',kpiFailed:'Fallidos',kpiRate:'Tasa de Éxito',kpiDuration:'Duración',chartDistribution:'Distribución de Tests',chartSuites:'Resultados por Suite',chartLinesCov:'Líneas cubiertas vs no cubiertas',overallProgress:'Progreso General',lblPassed:'exitosos',lblFailed:'fallidos',testSuites:'Test Suites',searchTests:'Buscar tests...',colTest:'Test',colStatus:'Estado',colDuration:'Duración',noErrors:'No se registraron errores. ¡Excelente!',errorCount:'Tests Fallidos',footerMadeBy:'Hecho por Applied AI Team — Stefanini',generatedAt:'Generado',totalDuration:'Duración total',codeCoverageTitle:'Cobertura de código (Jest)',codeCoverageHint:'Porcentaje sobre líneas/ramas instrumentadas. Ejecute npm run test:coverage antes del informe.',covLinePct:'Cobertura líneas',covBranchPct:'Cobertura ramas',covFilesTracked:'Archivos en alcance',covFilesNoLines:'Sin cubrir líneas (~0%)',covLinesLabel:'líneas',lineCoverage:'Cobertura de líneas',branchCoverage:'Cobertura de ramas',covByPackage:'Cobertura por paquete',colPackage:'Paquete',colFile:'Archivo',colLinesHit:'Líneas cubiertas'},
en:{reportTitle:'Unit Test Report — Frontend',tabExecutive:'Executive Summary',tabOverview:'Overall Results',tabDetails:'Test Details',tabCoverage:'Coverage',tabErrors:'Error Logs',executiveTitle:'Executive Summary',executiveSubtitle:'Unit test summary with AI',noSummary:'Summary unavailable. Set PERPLEXITY_API_KEY or OPENAI_API_KEY per MODEL_PROVIDER.',kpiTotal:'Total',kpiPassed:'Passed',kpiFailed:'Failed',kpiRate:'Pass Rate',kpiDuration:'Duration',chartDistribution:'Test Distribution',chartSuites:'Results by Suite',chartLinesCov:'Covered vs uncovered lines',overallProgress:'Overall Progress',lblPassed:'passed',lblFailed:'failed',testSuites:'Test Suites',searchTests:'Search tests...',colTest:'Test',colStatus:'Status',colDuration:'Duration',noErrors:'No errors recorded. Excellent!',errorCount:'Failed Tests',footerMadeBy:'Made by Applied AI Team — Stefanini',generatedAt:'Generated',totalDuration:'Total duration',codeCoverageTitle:'Code coverage (Jest)',codeCoverageHint:'Percentage over instrumented lines/branches. Run npm run test:coverage before the report.',covLinePct:'Line coverage',covBranchPct:'Branch coverage',covFilesTracked:'Files in scope',covFilesNoLines:'No line coverage (~0%)',covLinesLabel:'lines',lineCoverage:'Line coverage',branchCoverage:'Branch coverage',covByPackage:'Coverage by package',colPackage:'Package',colFile:'File',colLinesHit:'Lines hit'},
pt:{reportTitle:'Relatório de Testes Unitários — Frontend',tabExecutive:'Resumo Executivo',tabOverview:'Resultados Gerais',tabDetails:'Detalhes dos Testes',tabCoverage:'Cobertura',tabErrors:'Logs de Erro',executiveTitle:'Resumo Executivo',executiveSubtitle:'Resumo de testes unitários com IA',noSummary:'Resumo indisponível. Configure PERPLEXITY_API_KEY ou OPENAI_API_KEY conforme MODEL_PROVIDER.',kpiTotal:'Total',kpiPassed:'Aprovados',kpiFailed:'Falhos',kpiRate:'Taxa de Sucesso',kpiDuration:'Duração',chartDistribution:'Distribuição de Testes',chartSuites:'Resultados por Suite',chartLinesCov:'Linhas cobertas vs não cobertas',overallProgress:'Progresso Geral',lblPassed:'aprovados',lblFailed:'falhos',testSuites:'Test Suites',searchTests:'Buscar testes...',colTest:'Teste',colStatus:'Status',colDuration:'Duração',noErrors:'Nenhum erro registrado. Excelente!',errorCount:'Testes com Falha',footerMadeBy:'Feito por Applied AI Team — Stefanini',generatedAt:'Gerado',totalDuration:'Duração total',codeCoverageTitle:'Cobertura de código (Jest)',codeCoverageHint:'Percentual sobre linhas/ramos instrumentados. Execute npm run test:coverage antes do relatório.',covLinePct:'Cobertura de linhas',covBranchPct:'Cobertura de ramos',covFilesTracked:'Arquivos no escopo',covFilesNoLines:'Sem cobertura de linha (~0%)',covLinesLabel:'linhas',lineCoverage:'Cobertura de linhas',branchCoverage:'Cobertura de ramos',covByPackage:'Cobertura por pacote',colPackage:'Pacote',colFile:'Arquivo',colLinesHit:'Linhas cobertas'}
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
<\/script>
</body>
</html>`;
}

// ─── Markdown Report ──────────────────────────────────────────────────────────

function generateMarkdownReport(stats, testSuites, coverageInfo) {
  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : '0';
  let md = `## Frontend Unit Tests (Jest) Summary\n\n`;
  md += `| Metric | Value |\n|---------|-------|\n`;
  md += `| **Total Tests** | ${stats.total} |\n`;
  md += `| **Passed** | ${stats.passed} |\n`;
  md += `| **Failed** | ${stats.failures} |\n`;
  md += `| **Pass Rate** | ${passRate}% |\n`;
  md += `| **Total Duration** | ${stats.time.toFixed(2)}s |\n`;
  if (coverageInfo) {
    md += `| **Line coverage** | ${coverageInfo.lineRate.toFixed(2)}% |\n`;
    md += `| **Branch coverage** | ${coverageInfo.branchRate.toFixed(2)}% |\n`;
    md += `| **Lines covered / valid** | ${coverageInfo.linesCovered} / ${coverageInfo.linesValid} |\n`;
    md += `| **Source files (in report)** | ${coverageInfo.totalSourceFiles} |\n`;
    md += `| **Files ~0% line coverage** | ${coverageInfo.filesWithNoLineCoverage} |\n`;
  } else {
    md += `| **Code coverage** | *Run \`npm run test:coverage\` then regenerate report* |\n`;
  }
  md += `\n`;
  md += `## Test Suites (${testSuites.length})\n\n`;
  testSuites.forEach((suite, i) => {
    const sp = suite.tests - suite.failures;
    const sr = suite.tests > 0 ? ((sp / suite.tests) * 100).toFixed(2) : '0';
    md += `### ${i + 1}. ${suite.name}\n\n`;
    md += `| Total | Passed | Failed | Pass Rate | Duration |\n`;
    md += `|-------|--------|--------|-----------|----------|\n`;
    md += `| ${suite.tests} | ${sp} | ${suite.failures} | ${sr}% | ${suite.time.toFixed(2)}s |\n\n`;
  });
  md += `> Download artifact **frontend-unit-test-results** for the complete report with per-test details.\n`;
  return md;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  try {
    console.log('Generating frontend unit test report...\n');

    if (!fs.existsSync(JUNIT_XML_PATH)) {
      throw new Error(`junit.xml not found at: ${JUNIT_XML_PATH}`);
    }

    console.log('Reading junit.xml...');
    const parsedXml = await parseJunitXml();

    const stats = extractStats(parsedXml);
    console.log(`\nStats: Total=${stats.total}, Passed=${stats.passed}, Failed=${stats.failures}, Duration=${stats.time.toFixed(2)}s\n`);

    const testSuites = extractTestSuites(parsedXml);
    console.log(`Test suites found: ${testSuites.length}\n`);

    const coverageInfo = await loadCoverageInfo();

    console.log('Generating AI executive summary...');
    const summaryByLang = await generateExecutiveSummary(stats, testSuites, coverageInfo);

    console.log('Generating HTML report...');
    const htmlReport = generateHtmlReport(stats, testSuites, summaryByLang, coverageInfo);
    fs.writeFileSync(OUTPUT_HTML_PATH, htmlReport, 'utf-8');
    console.log(`  HTML report: ${OUTPUT_HTML_PATH}\n`);

    console.log('Generating Markdown report...');
    const markdownReport = generateMarkdownReport(stats, testSuites, coverageInfo);
    fs.writeFileSync(OUTPUT_MARKDOWN_PATH, markdownReport, 'utf-8');
    console.log(`  Markdown report: ${OUTPUT_MARKDOWN_PATH}\n`);

    console.log('Reports generated successfully.\n');
    process.exit(stats.failures > 0 ? 1 : 0);
  } catch (error) {
    console.error('\nFailed to generate report:', error.message);
    process.exit(1);
  }
}

main();
