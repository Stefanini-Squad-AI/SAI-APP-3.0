#!/usr/bin/env node

/**
 * Backend Test Report Generator — AURA Style (unitarias e integración homologadas)
 *
 * Unit (default): lee TestResults/test-results.trx → TestResults/test-report.html
 * Integración:    node generate-test-report.js --integration
 *                 lee TestResults/integration/integration-results.trx
 *                 → TestResults/integration/test-report.html
 *
 * Cobertura: se usa el coverage.cobertura.xml más reciente bajo el directorio de resultados.
 *
 * Environment variables:
 *   PERPLEXITY_API_KEY     — IA (obligatoria si --integration)
 *   BACKEND_REPORT_MODE=integration — equivalente a --integration
 *   PERPLEXITY_MODEL       — default: sonar
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

/** `--integration` | BACKEND_REPORT_MODE=integration → salida en TestResults/integration/ (misma UI que unitarias) */
const IS_INTEGRATION =
  process.argv.includes('--integration') || process.env.BACKEND_REPORT_MODE === 'integration';
const RESULTS_REL = IS_INTEGRATION ? path.join('TestResults', 'integration') : 'TestResults';
const TRX_NAME = IS_INTEGRATION ? 'integration-results.trx' : 'test-results.trx';
const TRX_PATH = path.join(__dirname, RESULTS_REL, TRX_NAME);
const TEST_RESULTS_DIR = path.join(__dirname, RESULTS_REL);
const HTML_REPORT_PATH = path.join(__dirname, RESULTS_REL, 'test-report.html');
const MARKDOWN_REPORT_PATH = path.join(__dirname, RESULTS_REL, 'test-report.md');

// ─── XML Parsing ──────────────────────────────────────────────────────────────

/** Usa el coverage.cobertura.xml más reciente (mtime) dentro del directorio de resultados. */
function findNewestCoberturaFile(dir) {
  if (!fs.existsSync(dir)) return null;
  const found = [];
  const walk = (d) => {
    for (const file of fs.readdirSync(d)) {
      const fullPath = path.join(d, file);
      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        continue;
      }
      if (stat.isDirectory()) walk(fullPath);
      else if (file === 'coverage.cobertura.xml') found.push({ path: fullPath, mtime: stat.mtimeMs });
    }
  };
  walk(dir);
  if (found.length === 0) return null;
  found.sort((a, b) => b.mtime - a.mtime);
  return found[0].path;
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
  const cobPath = findNewestCoberturaFile(TEST_RESULTS_DIR);
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
  const root = cov.$ || {};
  const packages = cov.packages?.[0]?.package || [];
  const lineRate = Number.parseFloat(root['line-rate'] || 0) * 100;
  const branchRate = Number.parseFloat(root['branch-rate'] || 0) * 100;
  const linesValid = Number.parseInt(String(root['lines-valid'] ?? 0), 10) || 0;
  const linesCovered = Number.parseInt(String(root['lines-covered'] ?? 0), 10) || 0;
  const branchesValid = Number.parseInt(String(root['branches-valid'] ?? 0), 10) || 0;
  const branchesCovered = Number.parseInt(String(root['branches-covered'] ?? 0), 10) || 0;

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

  return {
    lineRate,
    branchRate,
    linesValid,
    linesCovered,
    branchesValid,
    branchesCovered,
    packages: packageDetails,
  };
}

// ─── Perplexity AI Executive Summary ──────────────────────────────────────────

function sanitizeExecutiveMarkdown(md) {
  if (!md || typeof md !== 'string') return '';
  let s = md.replaceAll(/\[\d+\]/g, '');
  s = s.replaceAll(/```[\s\S]*?```/g, '');
  s = s.replaceAll(/\p{Extended_Pictographic}/gu, '');
  s = s.replaceAll(/\n{3,}/g, '\n\n').trim();
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

function generateLocalFallbackSummary(testInfo, coverageInfo, reportKind = 'unit') {
  const passRate = testInfo.total > 0 ? ((testInfo.passed / testInfo.total) * 100).toFixed(2) : '0';
  const passRateNum = parseFloat(passRate);
  const semaphore = passRateNum === 100 ? 'GREEN' : passRateNum >= 80 ? 'YELLOW' : 'RED';
  const date = new Date().toISOString().split('T')[0];
  const typeLabel = reportKind === 'integration' ? 'Integration' : 'Unit';

  const testsByClass = {};
  testInfo.tests.forEach(t => {
    const cls = t.className || 'Unknown';
    if (!testsByClass[cls]) testsByClass[cls] = [];
    testsByClass[cls].push(t);
  });

  const failedTests = testInfo.tests.filter(t => t.outcome === 'Failed');
  const failedList = failedTests.length > 0
    ? failedTests.map(t => `- [${t.className}] ${t.name}`).join('\n')
    : '- No failures detected.';

  const classLines = Object.entries(testsByClass).map(([cls, tests]) => {
    const p = tests.filter(t => t.outcome === 'Passed').length;
    const f = tests.filter(t => t.outcome === 'Failed').length;
    return `- ${cls}: ${tests.length} tests, ${p} passed, ${f} failed`;
  }).join('\n');

  const covBlock = coverageInfo
    ? `- Line coverage: ${coverageInfo.lineRate.toFixed(2)}%\n- Branch coverage: ${coverageInfo.branchRate.toFixed(2)}%`
    : '- Coverage data not available.';

  const makeContent = (lang) => {
    const L = {
      en: {
        ctx: `## Context Header\n\nProject: TuCreditoOnline — Backend (.NET 8, xUnit). ${typeLabel} tests. Report generated on ${date}. Total: ${testInfo.total} tests (${testInfo.passed} passed, ${testInfo.failed} failed, ${testInfo.skipped} skipped).`,
        sem: `## Overall Result (Traffic Light)\n\n**${semaphore}** — Pass rate: ${passRate}%.`,
        scope: `## Scope — What Was Tested?\n\n${classLines}`,
        findings: `## Detailed Findings\n\n### What Worked\n\n- ${testInfo.passed} of ${testInfo.total} tests passed successfully.\n\n### Failures Found\n\n${failedList}\n\n### Warnings\n\n- ${testInfo.failed === 0 ? 'No warnings.' : `${testInfo.failed} test(s) require attention.`}`,
        perf: `## Performance Metrics\n\n- Total tests: ${testInfo.total}\n- Pass rate: ${passRate}%`,
        risk: `## Risk Assessment\n\n- ${passRateNum === 100 ? 'Low risk — all tests passing.' : passRateNum >= 80 ? 'Medium risk — some tests failing.' : 'High risk — significant test failures detected.'}`,
        cov: `## Test Coverage\n\n${covBlock}`,
        rec: `## Actionable Recommendations\n\n- ${testInfo.failed > 0 ? 'Fix failing tests before merging.' : 'All tests pass — continue monitoring coverage.'}`,
        trend: `## Historical Trend\n\n- Single run — no historical data available for comparison.`,
        gloss: `## Glossary of Terms\n\n- **Unit test**: a test that validates a single component or function in isolation.\n- **xUnit**: the testing framework used for .NET projects.\n- **Line coverage**: percentage of source code lines executed during tests.\n- **Branch coverage**: percentage of code branches (if/else) exercised during tests.`,
      },
      es: {
        ctx: `## Encabezado de Contexto\n\nProyecto: TuCreditoOnline — Backend (.NET 8, xUnit). Pruebas ${reportKind === 'integration' ? 'de integración' : 'unitarias'}. Reporte generado el ${date}. Total: ${testInfo.total} tests (${testInfo.passed} exitosos, ${testInfo.failed} fallidos, ${testInfo.skipped} omitidos).`,
        sem: `## Resultado General (Semáforo)\n\n**${semaphore === 'GREEN' ? 'VERDE' : semaphore === 'YELLOW' ? 'AMARILLO' : 'ROJO'}** — Tasa de éxito: ${passRate}%.`,
        scope: `## Alcance — ¿Qué se probó?\n\n${classLines}`,
        findings: `## Hallazgos Detallados\n\n### Lo que funcionó\n\n- ${testInfo.passed} de ${testInfo.total} pruebas pasaron exitosamente.\n\n### Fallos encontrados\n\n${failedList}\n\n### Advertencias\n\n- ${testInfo.failed === 0 ? 'Sin advertencias.' : `${testInfo.failed} prueba(s) requieren atención.`}`,
        perf: `## Métricas de Rendimiento\n\n- Total de pruebas: ${testInfo.total}\n- Tasa de éxito: ${passRate}%`,
        risk: `## Evaluación de Riesgos\n\n- ${passRateNum === 100 ? 'Riesgo bajo — todas las pruebas pasaron.' : passRateNum >= 80 ? 'Riesgo medio — algunas pruebas fallaron.' : 'Riesgo alto — se detectaron fallos significativos.'}`,
        cov: `## Cobertura de Pruebas\n\n${covBlock}`,
        rec: `## Recomendaciones Accionables\n\n- ${testInfo.failed > 0 ? 'Corregir las pruebas fallidas antes de hacer merge.' : 'Todas las pruebas pasan — continuar monitoreando la cobertura.'}`,
        trend: `## Tendencia Histórica\n\n- Ejecución única — no hay datos históricos disponibles para comparación.`,
        gloss: `## Glosario de Términos\n\n- **Prueba unitaria**: prueba que valida un componente o función de forma aislada.\n- **xUnit**: framework de pruebas utilizado en proyectos .NET.\n- **Cobertura de líneas**: porcentaje de líneas de código fuente ejecutadas durante las pruebas.\n- **Cobertura de ramas**: porcentaje de ramas de código (if/else) ejercitadas durante las pruebas.`,
      },
      pt: {
        ctx: `## Cabeçalho de Contexto\n\nProjeto: TuCreditoOnline — Backend (.NET 8, xUnit). Testes ${reportKind === 'integration' ? 'de integração' : 'unitários'}. Relatório gerado em ${date}. Total: ${testInfo.total} testes (${testInfo.passed} aprovados, ${testInfo.failed} falhos, ${testInfo.skipped} ignorados).`,
        sem: `## Resultado Geral (Semáforo)\n\n**${semaphore === 'GREEN' ? 'VERDE' : semaphore === 'YELLOW' ? 'AMARELO' : 'VERMELHO'}** — Taxa de sucesso: ${passRate}%.`,
        scope: `## Escopo — O que foi testado?\n\n${classLines}`,
        findings: `## Achados Detalhados\n\n### O que funcionou\n\n- ${testInfo.passed} de ${testInfo.total} testes passaram com sucesso.\n\n### Falhas encontradas\n\n${failedList}\n\n### Avisos\n\n- ${testInfo.failed === 0 ? 'Sem avisos.' : `${testInfo.failed} teste(s) requerem atenção.`}`,
        perf: `## Métricas de Desempenho\n\n- Total de testes: ${testInfo.total}\n- Taxa de sucesso: ${passRate}%`,
        risk: `## Avaliação de Riscos\n\n- ${passRateNum === 100 ? 'Risco baixo — todos os testes passaram.' : passRateNum >= 80 ? 'Risco médio — alguns testes falharam.' : 'Risco alto — falhas significativas detectadas.'}`,
        cov: `## Cobertura de Testes\n\n${covBlock}`,
        rec: `## Recomendações Acionáveis\n\n- ${testInfo.failed > 0 ? 'Corrigir os testes com falha antes do merge.' : 'Todos os testes passam — continuar monitorando a cobertura.'}`,
        trend: `## Tendência Histórica\n\n- Execução única — sem dados históricos disponíveis para comparação.`,
        gloss: `## Glossário de Termos\n\n- **Teste unitário**: teste que valida um componente ou função de forma isolada.\n- **xUnit**: framework de testes utilizado em projetos .NET.\n- **Cobertura de linhas**: percentual de linhas de código-fonte executadas durante os testes.\n- **Cobertura de branches**: percentual de ramificações de código (if/else) exercitadas durante os testes.`,
      },
    };
    const l = L[lang] || L.en;
    return [l.ctx, l.sem, l.scope, l.findings, l.perf, l.risk, l.cov, l.rec, l.trend, l.gloss].join('\n\n');
  };

  return { en: makeContent('en'), es: makeContent('es'), pt: makeContent('pt') };
}

async function generateExecutiveSummary(testInfo, coverageInfo, reportKind = 'unit') {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    if (reportKind === 'integration') {
      console.warn('  PERPLEXITY_API_KEY not set — generating local fallback executive summary for integration report.');
    } else {
      console.log('  PERPLEXITY_API_KEY not set — generating local fallback executive summary.');
    }
    return generateLocalFallbackSummary(testInfo, coverageInfo, reportKind);
  }

  const model = process.env.PERPLEXITY_MODEL || 'sonar';
  const passRate = testInfo.total > 0 ? ((testInfo.passed / testInfo.total) * 100).toFixed(2) : '0';

  const testsByClass = {};
  testInfo.tests.forEach(t => {
    const cls = t.className || 'Unknown';
    if (!testsByClass[cls]) testsByClass[cls] = [];
    testsByClass[cls].push(t);
  });

  const systemPromptUnit = `You are a senior QA / engineering lead writing a structured EXECUTIVE UNIT-TEST REPORT for a .NET / xUnit backend.
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

  const systemPromptIntegration = `You are a senior QA / engineering lead writing a structured EXECUTIVE INTEGRATION TEST REPORT for a .NET 8 / xUnit backend.
Output Markdown only inside JSON string values (no HTML). For EACH language use the SAME outline and depth.

Context: these tests validate the API and infrastructure together (IntegrationTests), typically via HTTP against a test host (e.g. WebApplicationFactory), with MongoDB and related services — in local development often orchestrated with Docker Compose.

Style and audience:
- Explain at a high level in clear, professional prose. Readers may not be deeply technical: define acronyms once, connect failures to user-visible or operational risk.
- Be substantive: each section should add real insight from the data (not filler).
- Do NOT use emojis, decorative symbols, or numeric reference markers like [1] or [12].
- Do NOT include fenced code blocks (\`\`\`), inline code snippets, file paths in backticks, or pasted JSON.
- Use ## for the 10 main sections. Under "Hallazgos" / "Findings" / "Achados" use exactly these three ### subsections.
- Use bullet lists (- item) where helpful.
- Avoid raw stack traces; paraphrase failure themes (HTTP status, auth, DB connectivity, timeouts).
- Historical trend: usually single run — state explicitly if no prior data.
- Glossary: 4–8 plain-language terms (integration test, API, WebApplicationFactory, HTTP, MongoDB, Docker, line/branch coverage, etc.) in the target language.

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

  const systemPrompt = reportKind === 'integration' ? systemPromptIntegration : systemPromptUnit;

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

  const failedTestsSection = failedTests ? `Failed Tests:\n${failedTests}` : 'No test failures detected.';

  const userPrompt =
    reportKind === 'integration'
      ? `Analyze these Backend INTEGRATION test results (namespace IntegrationTests, HTTP/API, WebApplicationFactory) and generate an executive summary:

Project: TuCreditoOnline — Backend (.NET 8, xUnit)
Test type: Integration (API + infrastructure; services often run via Docker Compose locally)
Total Tests: ${testInfo.total}
Passed: ${testInfo.passed}
Failed: ${testInfo.failed}
Skipped: ${testInfo.skipped}
Pass Rate: ${passRate}%
Date: ${new Date().toISOString()}
${coverageSummary}

Test classes / areas:
${classSummary}

${failedTestsSection}

Relate coverage (lines/branches) to how much of the application code was exercised by these integration scenarios when metrics are present.`
      : `Analyze these Backend unit test results and generate an executive summary:

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

${failedTestsSection}`;

  try {
    console.log(`  Calling Perplexity API (model: ${model}) [${reportKind}]...`);
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
      console.log('  Generating local fallback executive summary.');
      return generateLocalFallbackSummary(testInfo, coverageInfo, reportKind);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    console.log(`  AI response received (${data.usage?.total_tokens ?? '?'} tokens).`);
    const escNewlineForLog = String.raw`\n`;
    console.log(`  AI response first 200 chars: ${content.slice(0, 200).replaceAll('\n', escNewlineForLog)}`);

    const parsed = parseSummaryJson(content);
    if (parsed) return sanitizeExecutiveSummaryByLang(parsed);
    console.warn('  parseSummaryJson returned null — falling back to raw content as single-lang summary.');
    // Fallback: unescape literal \n sequences so mdToHtml can split lines properly
    const unescaped = content.trim().replaceAll(String.raw`\n`, '\n').replaceAll(String.raw`\t`, '\t');
    return sanitizeExecutiveSummaryByLang({ en: unescaped, es: unescaped, pt: unescaped });
  } catch (err) {
    console.warn(`  Perplexity API call failed: ${err?.message ?? String(err)}`);
    console.log('  Generating local fallback executive summary.');
    return generateLocalFallbackSummary(testInfo, coverageInfo, reportKind);
  }
}

function tryParseSummaryJson(str) {
  try {
    const p = JSON.parse(str.trim());
    const en = typeof p.en === 'string' ? p.en.trim() : '';
    const es = typeof p.es === 'string' ? p.es.trim() : '';
    const pt = typeof p.pt === 'string' ? p.pt.trim() : '';
    if (!en && !es && !pt) return null;
    return { en: en || es || pt, es: es || en || pt, pt: pt || en || es };
  } catch {
    return null;
  }
}

/** Fix literal newlines/tabs inside JSON string values so JSON.parse succeeds */
function fixJsonLiteralNewlines(str) {
  let out = '';
  let inStr = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"' && (i === 0 || str[i - 1] !== '\\')) {
      inStr = !inStr;
      out += ch;
    } else if (inStr && ch === '\n') {
      out += String.raw`\n`;
    } else if (inStr && ch === '\r') {
      out += String.raw`\r`;
    } else if (inStr && ch === '\t') {
      out += String.raw`\t`;
    } else {
      out += ch;
    }
  }
  return out;
}

function pushUniqueCandidate(candidates, x) {
  const t = typeof x === 'string' ? x.trim() : '';
  if (t && !candidates.includes(t)) candidates.push(t);
}

function collectSummaryJsonCandidates(s) {
  const candidates = [];
  pushUniqueCandidate(candidates, s);

  if (s.startsWith('"""')) {
    let inner = s.replace(/^"""\s*(?:json\s*)?/i, '').trim();
    if (inner.endsWith('"""')) inner = inner.slice(0, -3).trim();
    pushUniqueCandidate(candidates, inner);
  }

  const fenceMatch = /^(`{1,4})(?:json)?\s*/im.exec(s);
  if (fenceMatch) {
    const start = fenceMatch.index + fenceMatch[0].length;
    const closePattern = fenceMatch[1];
    const closeIdx = s.indexOf(closePattern, start);
    if (closeIdx > start) pushUniqueCandidate(candidates, s.slice(start, closeIdx).trim());
    const lastClose = s.lastIndexOf(closePattern);
    if (lastClose > start && lastClose !== closeIdx) pushUniqueCandidate(candidates, s.slice(start, lastClose).trim());
  }

  if (/^json\s/i.test(s)) {
    pushUniqueCandidate(candidates, s.replace(/^json\s*/i, '').trim());
  }

  const b0 = s.indexOf('{');
  const b1 = s.lastIndexOf('}');
  if (b0 !== -1 && b1 > b0) pushUniqueCandidate(candidates, s.slice(b0, b1 + 1));

  return candidates;
}

/** Match "key": "..." where value can contain escaped quotes (LLM-malformed JSON). */
function extractSummaryLangValue(text, key) {
  const pattern = new RegExp(String.raw`"` + key + String.raw`"\s*:\s*"((?:[^"\\]|\\.)*)"`);
  const m = pattern.exec(text);
  if (!m) return '';
  try {
    return JSON.parse(`"${m[1]}"`);
  } catch {
    return m[1];
  }
}

function parseSummaryJsonFromRegexCandidates(candidates) {
  for (const c of candidates) {
    const en = extractSummaryLangValue(c, 'en');
    const es = extractSummaryLangValue(c, 'es');
    const pt = extractSummaryLangValue(c, 'pt');
    if (en || es || pt) {
      return { en: en || es || pt, es: es || en || pt, pt: pt || en || es };
    }
  }
  return null;
}

function parseSummaryJson(raw) {
  if (raw == null || typeof raw !== 'string') return null;

  const candidates = collectSummaryJsonCandidates(raw.trim());

  for (const c of candidates) {
    const parsed = tryParseSummaryJson(c);
    if (parsed) return parsed;
  }
  for (const c of candidates) {
    const parsed = tryParseSummaryJson(fixJsonLiteralNewlines(c));
    if (parsed) return parsed;
  }

  return parseSummaryJsonFromRegexCandidates(candidates);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s) {
  if (!s) return '';
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function mdInline(raw) {
  let h = esc(raw);
  h = h.replaceAll(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 dark:text-white font-semibold">$1</strong>');
  h = h.replaceAll(/\*(.+?)\*/g, '<em class="text-slate-600 dark:text-gray-400">$1</em>');
  return h;
}

function mdToHtml(md) {
  if (!md) return '';
  const lines = md.replaceAll('\r\n', '\n').split('\n');
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

/** Textos i18n embebidos en el HTML (unit vs integration). */
function buildI18nPayload(reportKind) {
  const int = reportKind === 'integration';
  return {
    es: {
      reportTitle: int ? 'Reporte de Pruebas de Integración — Backend' : 'Reporte de Pruebas Unitarias — Backend',
      tabExecutive: 'Resumen Ejecutivo',
      tabOverview: 'Resultados Generales',
      tabDetails: 'Detalle de Tests',
      tabCoverage: 'Cobertura',
      tabErrors: 'Logs de Error',
      executiveTitle: 'Resumen Ejecutivo',
      executiveSubtitle: int ? 'Resumen de pruebas de integración con AI' : 'Resumen de pruebas unitarias con AI',
      noSummary: int
        ? 'Resumen ejecutivo no disponible. Configure PERPLEXITY_API_KEY (obligatorio para el informe de integración).'
        : 'Resumen ejecutivo no disponible. Configure PERPLEXITY_API_KEY para habilitar esta funcionalidad.',
      kpiTotal: 'Total',
      kpiPassed: 'Exitosos',
      kpiFailed: 'Fallidos',
      kpiRate: 'Tasa de Éxito',
      kpiSkipped: 'Omitidos',
      chartDistribution: 'Distribución de Tests',
      chartClasses: 'Resultados por Clase',
      overallProgress: 'Progreso General',
      lblPassed: 'exitosos',
      lblFailed: 'fallidos',
      testClasses: 'Clases de Test',
      searchTests: 'Buscar tests...',
      colTest: 'Test',
      colStatus: 'Estado',
      colDuration: 'Duración',
      colModule: 'Módulo',
      colFile: 'Archivo',
      colLines: 'Líneas',
      lineCoverage: 'Cobertura de Líneas',
      branchCoverage: 'Cobertura de Ramas',
      covByModule: 'Cobertura por Módulo',
      noErrors: 'No se registraron errores. ¡Excelente!',
      errorCount: 'Tests Fallidos',
      errorMessage: 'Error',
      stackTrace: 'Stack Trace',
      footerMadeBy: 'Hecho por Applied AI Team — Stefanini',
      generatedAt: 'Generado',
      covIntBridgeTitle: 'Puente: escenarios de integración y código de aplicación',
      covIntBridgeIntro:
        'Relaciona los escenarios ejecutados en esta corrida con el porcentaje de líneas y ramas del código instrumentado que quedaron ejercidos. La brecha estima cuánto código aún no fue tocado por estas pruebas; no implica un número fijo de “escenarios faltantes”.',
      covIntScenarios: 'Escenarios en esta corrida',
      covIntLineGlobal: 'Cobertura global (líneas)',
      covIntBranchGlobal: 'Cobertura global (ramas)',
      covIntLinesCount: 'Líneas cubiertas / instrumentadas',
      covIntBranchCount: 'Ramas cubiertas / instrumentadas',
      covIntGapLines: 'Brecha líneas (no ejercidas)',
      covIntGapBranch: 'Brecha ramas (no ejercidas)',
      covIntExpand:
        'Integrar más escenarios que recorran flujos y ramas aún no cubiertas puede reducir la brecha. Un escenario puede cubrir muchas líneas si el flujo es amplio; la prioridad es cubrir rutas críticas de negocio y error.',
      covMissingTitle: 'Métricas de cobertura no disponibles',
      covMissingBody:
        'No se encontró coverage.cobertura.xml bajo TestResults/integration. Ejecute las pruebas con Coverlet (ya referenciado en el proyecto de tests), por ejemplo: dotnet test ... /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura /p:CoverletOutput=./TestResults/integration/coverage',
      tabCoverageCode: 'Cobertura de código',
    },
    en: {
      reportTitle: int ? 'Integration Test Report — Backend' : 'Unit Test Report — Backend',
      tabExecutive: 'Executive Summary',
      tabOverview: 'Overall Results',
      tabDetails: 'Test Details',
      tabCoverage: 'Coverage',
      tabErrors: 'Error Logs',
      executiveTitle: 'Executive Summary',
      executiveSubtitle: int ? 'Integration test summary with AI' : 'Unit test summary with AI',
      noSummary: int
        ? 'Executive summary unavailable. PERPLEXITY_API_KEY is required for the integration report.'
        : 'Executive summary not available. Set PERPLEXITY_API_KEY to enable this feature.',
      kpiTotal: 'Total',
      kpiPassed: 'Passed',
      kpiFailed: 'Failed',
      kpiRate: 'Pass Rate',
      kpiSkipped: 'Skipped',
      chartDistribution: 'Test Distribution',
      chartClasses: 'Results by Class',
      overallProgress: 'Overall Progress',
      lblPassed: 'passed',
      lblFailed: 'failed',
      testClasses: 'Test Classes',
      searchTests: 'Search tests...',
      colTest: 'Test',
      colStatus: 'Status',
      colDuration: 'Duration',
      colModule: 'Module',
      colFile: 'File',
      colLines: 'Lines',
      lineCoverage: 'Line Coverage',
      branchCoverage: 'Branch Coverage',
      covByModule: 'Coverage by Module',
      noErrors: 'No errors recorded. Excellent!',
      errorCount: 'Failed Tests',
      errorMessage: 'Error',
      stackTrace: 'Stack Trace',
      footerMadeBy: 'Made by Applied AI Team — Stefanini',
      generatedAt: 'Generated',
      covIntBridgeTitle: 'Bridge: integration scenarios and application code',
      covIntBridgeIntro:
        'Links the scenarios executed in this run with line and branch percentages of instrumented code that was exercised. The gap estimates how much code was not touched; it does not map to a fixed number of “missing scenarios”.',
      covIntScenarios: 'Scenarios in this run',
      covIntLineGlobal: 'Overall line coverage',
      covIntBranchGlobal: 'Overall branch coverage',
      covIntLinesCount: 'Lines covered / instrumented',
      covIntBranchCount: 'Branches covered / instrumented',
      covIntGapLines: 'Line gap (not exercised)',
      covIntGapBranch: 'Branch gap (not exercised)',
      covIntExpand:
        'Adding scenarios that exercise uncovered flows and branches can reduce the gap. One scenario may cover many lines; prioritize critical business and error paths.',
      covMissingTitle: 'Coverage metrics unavailable',
      covMissingBody:
        'coverage.cobertura.xml was not found under TestResults/integration. Run tests with Coverlet, e.g.: dotnet test ... /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura /p:CoverletOutput=./TestResults/integration/coverage',
      tabCoverageCode: 'Code coverage',
    },
    pt: {
      reportTitle: int ? 'Relatório de Testes de Integração — Backend' : 'Relatório de Testes Unitários — Backend',
      tabExecutive: 'Resumo Executivo',
      tabOverview: 'Resultados Gerais',
      tabDetails: 'Detalhes dos Testes',
      tabCoverage: 'Cobertura',
      tabErrors: 'Logs de Erro',
      executiveTitle: 'Resumo Executivo',
      executiveSubtitle: int ? 'Resumo de testes de integração com IA' : 'Resumo de testes unitários com IA',
      noSummary: int
        ? 'Resumo indisponível. PERPLEXITY_API_KEY é obrigatória para o relatório de integração.'
        : 'Resumo executivo não disponível. Configure PERPLEXITY_API_KEY para habilitar esta funcionalidade.',
      kpiTotal: 'Total',
      kpiPassed: 'Aprovados',
      kpiFailed: 'Falhos',
      kpiRate: 'Taxa de Sucesso',
      kpiSkipped: 'Omitidos',
      chartDistribution: 'Distribuição de Testes',
      chartClasses: 'Resultados por Classe',
      overallProgress: 'Progresso Geral',
      lblPassed: 'aprovados',
      lblFailed: 'falhos',
      testClasses: 'Classes de Teste',
      searchTests: 'Buscar testes...',
      colTest: 'Teste',
      colStatus: 'Status',
      colDuration: 'Duração',
      colModule: 'Módulo',
      colFile: 'Arquivo',
      colLines: 'Linhas',
      lineCoverage: 'Cobertura de Linhas',
      branchCoverage: 'Cobertura de Branches',
      covByModule: 'Cobertura por Módulo',
      noErrors: 'Nenhum erro registrado. Excelente!',
      errorCount: 'Testes com Falha',
      errorMessage: 'Erro',
      stackTrace: 'Stack Trace',
      footerMadeBy: 'Feito por Applied AI Team — Stefanini',
      generatedAt: 'Gerado',
      covIntBridgeTitle: 'Ponte: cenários de integração e código da aplicação',
      covIntBridgeIntro:
        'Relaciona os cenários desta execução com as percentagens de linhas e ramas instrumentadas exercitadas. A lacuna estima quanto código não foi tocado; não corresponde a um número fixo de “cenários em falta”.',
      covIntScenarios: 'Cenários nesta execução',
      covIntLineGlobal: 'Cobertura global (linhas)',
      covIntBranchGlobal: 'Cobertura global (ramas)',
      covIntLinesCount: 'Linhas cobertas / instrumentadas',
      covIntBranchCount: 'Ramas cobertas / instrumentadas',
      covIntGapLines: 'Lacuna de linhas (não exercidas)',
      covIntGapBranch: 'Lacuna de ramas (não exercidas)',
      covIntExpand:
        'Novos cenários que percorram fluxos e ramos ainda não cobertos podem reduzir a lacuna. Um cenário pode cobrir muitas linhas; priorize fluxos críticos de negócio e erro.',
      covMissingTitle: 'Métricas de cobertura indisponíveis',
      covMissingBody:
        'coverage.cobertura.xml não encontrado em TestResults/integration. Execute os testes com Coverlet, ex.: dotnet test ... /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura /p:CoverletOutput=./TestResults/integration/coverage',
      tabCoverageCode: 'Cobertura de código',
    },
  };
}

/**
 * Panel superior solo para informes de integración: escenarios vs % líneas/ramas y brechas.
 */
function renderIntegrationCoverageBridge(testInfo, coverageInfo) {
  const n = testInfo.total;
  const has = coverageInfo != null;
  const lineGap = has ? Math.max(0, 100 - coverageInfo.lineRate) : null;
  const branchGap = has ? Math.max(0, 100 - coverageInfo.branchRate) : null;
  const lv = has ? coverageInfo.linesValid : 0;
  const lc = has ? coverageInfo.linesCovered : 0;
  const bv = has ? coverageInfo.branchesValid : 0;
  const bc = has ? coverageInfo.branchesCovered : 0;

  const card = (titleKey, defTitle, value) => `
    <div class="rounded-lg border border-indigo-200/80 dark:border-indigo-800/50 bg-white/80 dark:bg-zinc-900/60 p-3">
      <p class="text-[10px] font-medium text-indigo-600 dark:text-indigo-300 leading-tight" data-i18n="${titleKey}">${defTitle}</p>
      <p class="text-lg font-bold text-slate-800 dark:text-white mt-1">${value}</p>
    </div>`;

  return `
  <div class="bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-800/40 rounded-xl p-5 mb-6">
    <h3 class="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-2" data-i18n="covIntBridgeTitle">Puente: escenarios de integración y código de aplicación</h3>
    <p class="text-xs text-indigo-900/85 dark:text-indigo-200/90 mb-4 leading-relaxed" data-i18n="covIntBridgeIntro">Relaciona los escenarios ejecutados con el porcentaje de líneas y ramas instrumentadas ejercidas.</p>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      ${card('covIntScenarios', 'Escenarios en esta corrida', String(n))}
      ${card('covIntLineGlobal', 'Cobertura global (líneas)', has ? `${coverageInfo.lineRate.toFixed(2)}%` : '—')}
      ${card('covIntBranchGlobal', 'Cobertura global (ramas)', has ? `${coverageInfo.branchRate.toFixed(2)}%` : '—')}
      ${card('covIntLinesCount', 'Líneas cubiertas / instrumentadas', has && lv > 0 ? `${lc} / ${lv}` : '—')}
      ${card('covIntGapLines', 'Brecha líneas (no ejercidas)', has ? `${lineGap.toFixed(2)}%` : '—')}
      ${card('covIntGapBranch', 'Brecha ramas (no ejercidas)', has ? `${branchGap.toFixed(2)}%` : '—')}
    </div>
    ${has && bv > 0 ? `<p class="text-xs text-indigo-800 dark:text-indigo-300 mb-2"><span data-i18n="covIntBranchCount">Ramas cubiertas / instrumentadas</span>: <strong>${bc} / ${bv}</strong></p>` : ''}
    <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-indigo-200/60 dark:border-indigo-800/40 pt-3" data-i18n="covIntExpand">Un mayor número de escenarios puede aumentar la cobertura; priorice rutas críticas.</p>
  </div>`;
}

function renderCoverageMissingPanel() {
  return `
  <div class="rounded-xl border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/20 p-5 mb-6">
    <h4 class="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2" data-i18n="covMissingTitle">Métricas de cobertura no disponibles</h4>
    <p class="text-xs text-amber-900/90 dark:text-amber-200/85 leading-relaxed" data-i18n="covMissingBody">No se encontró coverage.cobertura.xml bajo TestResults/integration. Ejecute las pruebas con Coverlet (ya referenciado en el proyecto de tests), por ejemplo: dotnet test ... /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura /p:CoverletOutput=./TestResults/integration/coverage</p>
  </div>`;
}

function renderPackageClassRows(pkg) {
  return pkg.classes.map(cls => `
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
        </tr>`).join('');
}

function renderPackageClassBlock(pkg) {
  if (pkg.classes.length === 0) return '';
  return `
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
${renderPackageClassRows(pkg)}
      </tbody>
    </table>
  </div>`;
}

/** Bloques KPI + tablas de cobertura (mismo contenido que antes para unit/integration con XML). */
function renderCoverageDetailBlocks(coverageInfo) {
  return `
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

${coverageInfo.packages.map(pkg => renderPackageClassBlock(pkg)).join('')}`;
}

function renderCoverageTabBody(testInfo, coverageInfo, int) {
  let body = '';
  if (int) body += renderIntegrationCoverageBridge(testInfo, coverageInfo);
  if (int && !coverageInfo) body += renderCoverageMissingPanel();
  if (coverageInfo) body += renderCoverageDetailBlocks(coverageInfo);
  return body;
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

function generateHtmlReport(testInfo, coverageInfo, summaryByLang, reportKind = 'unit') {
  const passRate = testInfo.total > 0 ? ((testInfo.passed / testInfo.total) * 100).toFixed(2) : '0';
  const passRateNum = Number.parseFloat(passRate);
  const int = reportKind === 'integration';
  const showCoverageTab = Boolean(coverageInfo || int);
  const coverageTabI18nKey = int ? 'tabCoverageCode' : 'tabCoverage';
  const coverageTabI18nDefault = int ? 'Cobertura de código' : 'Cobertura';
  const pageTitle = int ? 'Backend Integration Test Report — TuCreditoOnline' : 'Backend Unit Test Report — TuCreditoOnline';
  const headerSub = int
    ? `.NET 8 · xUnit · Integración · API · WebApplicationFactory · ${new Date().toLocaleDateString('es-ES')}`
    : `.NET 8 · xUnit · Moq · FluentAssertions · ${new Date().toLocaleDateString('es-ES')}`;
  const i18nJson = JSON.stringify(buildI18nPayload(reportKind)).replaceAll('</', String.raw`<\/`);

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
<title>${pageTitle}</title>
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
/* OS dropdown uses a light surface; inherited text-white on <select> made options invisible */
#lang-select option{color:#0f172a;background-color:#f8fafc}
html.dark #lang-select option{color:#fafafa;background-color:#3f3f46}
</style>
</head>
<body class="bg-slate-100 text-slate-800 dark:bg-zinc-950 dark:text-zinc-100 min-h-screen font-sans transition-colors duration-300">

<!-- ═══ HEADER ═══ -->
<header class="bg-gradient-to-r from-aura-600 to-aura-800 dark:from-zinc-900 dark:to-zinc-900 border-b border-aura-700 dark:border-zinc-800 sticky top-0 z-40">
<div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
  <div class="flex items-center gap-3">
    <div class="w-9 h-9 rounded-lg bg-white/20 dark:bg-aura-600 flex items-center justify-center font-bold text-white text-[10px] tracking-tight">SAI</div>
    <div>
      <h1 class="text-lg font-bold text-white leading-tight" data-i18n="reportTitle">${int ? 'Reporte de Pruebas de Integración — Backend' : 'Reporte de Pruebas Unitarias — Backend'}</h1>
      <p class="text-xs text-white/70">${headerSub}</p>
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
  ${showCoverageTab ? `<button data-tab="coverage" class="tab-btn flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap"><i class="bi bi-bar-chart-line"></i><span data-i18n="${coverageTabI18nKey}">${coverageTabI18nDefault}</span></button>` : ''}
  <button data-tab="errors" class="tab-btn flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap"><i class="bi bi-exclamation-triangle"></i><span data-i18n="tabErrors">Logs de Error</span></button>
</div>
</nav>

<main class="max-w-7xl mx-auto px-4 py-6 space-y-6">

<!-- ═══ TAB: EXECUTIVE SUMMARY ═══ -->
<section id="tab-executive" class="tab-panel active">
<div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
  <div class="mb-4">
    <h2 class="text-xl font-bold text-slate-800 dark:text-white" data-i18n="executiveTitle">Resumen Ejecutivo</h2>
    <p class="text-xs text-slate-500 dark:text-gray-400 mt-1" data-i18n="executiveSubtitle">${int ? 'Resumen de pruebas de integración con AI' : 'Resumen de pruebas unitarias con AI'}</p>
  </div>
  <div id="executive-summary-content" class="prose max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
    ${summaryHtmlByLang.es || `<p class="text-slate-400 dark:text-gray-500 italic" data-i18n="noSummary">${int ? 'Resumen ejecutivo no disponible. Configure PERPLEXITY_API_KEY (obligatorio para el informe de integración).' : 'Resumen ejecutivo no disponible. Configure PERPLEXITY_API_KEY para habilitar esta funcionalidad.'}</p>`}
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

${showCoverageTab ? `
<!-- ═══ TAB: COVERAGE ═══ -->
<section id="tab-coverage" class="tab-panel">
${renderCoverageTabBody(testInfo, coverageInfo, int)}
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
const i18n = ${i18nJson};

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

function generateMarkdownReport(testInfo, coverageInfo, reportKind = 'unit') {
  const passRate = testInfo.total > 0 ? ((testInfo.passed / testInfo.total) * 100).toFixed(2) : '0';
  const int = reportKind === 'integration';
  let md = int
    ? `## Backend Integration Tests (.NET 8 / xUnit / IntegrationTests) Summary\n\n`
    : `## Backend Unit Tests (.NET 8 / xUnit) Summary\n\n`;
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

  md += int
    ? `> Artefacto: **backend/TestResults/integration/** — informe HTML homologado con pruebas unitarias.\n`
    : `> Download artifact **backend-unit-test-results** for the complete report with per-test details.\n`;
  return md;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

try {
  const reportKind = IS_INTEGRATION ? 'integration' : 'unit';
  console.log(
    reportKind === 'integration'
      ? 'Generating backend integration test report...\n'
      : 'Generating backend unit test report...\n',
  );

  if (reportKind === 'integration') {
    const k = process.env.PERPLEXITY_API_KEY;
    if (!k || k.startsWith('your_')) {
      console.error(
        'ERROR: El informe de integración exige PERPLEXITY_API_KEY en .env (resumen ejecutivo con IA obligatorio).',
      );
      process.exit(1);
    }
  }

  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });

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
  const summaryByLang = await generateExecutiveSummary(testInfo, coverageInfo, reportKind);

  if (
    reportKind === 'integration' &&
    (!summaryByLang.es?.trim() && !summaryByLang.en?.trim() && !summaryByLang.pt?.trim())
  ) {
    console.error('ERROR: No se pudo generar el resumen ejecutivo con IA. Revise PERPLEXITY_API_KEY y la cuota de API.');
    process.exit(1);
  }

  console.log('\nGenerating HTML report...');
  const htmlReport = generateHtmlReport(testInfo, coverageInfo, summaryByLang, reportKind);
  fs.writeFileSync(HTML_REPORT_PATH, htmlReport, 'utf-8');
  console.log(`  HTML report: ${HTML_REPORT_PATH}`);

  console.log('\nGenerating Markdown report...');
  const markdownReport = generateMarkdownReport(testInfo, coverageInfo, reportKind);
  fs.writeFileSync(MARKDOWN_REPORT_PATH, markdownReport, 'utf-8');
  console.log(`  Markdown report: ${MARKDOWN_REPORT_PATH}`);

  console.log('\nReports generated successfully.\n');
  process.exit(testInfo.failed > 0 ? 1 : 0);
} catch (error) {
  console.error('Failed to generate reports:', error);
  process.exit(1);
}
