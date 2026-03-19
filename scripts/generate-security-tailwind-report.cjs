#!/usr/bin/env node

/**
 * OWASP ZAP — Tailwind Dashboard v2 (AURA-homologous)
 *
 * Lee los JSON oficiales de ZAP y genera un reporte interactivo:
 *   test-results/security/tailwind-dashboard/security-dashboard.html
 *   test-results/security/tailwind-dashboard/security-dashboard.md
 *
 * Características: TailwindCSS, Dark/Grey mode, i18n ES/EN/PT, Chart.js,
 * widgets KPI, resumen ejecutivo vía LLM (.env raíz: PERPLEXITY_API_KEY, PERPLEXITY_MODEL).
 *
 * Uso (desde la raíz del repo SAI-APP-3.0):
 *   node scripts/generate-security-tailwind-report.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const SECURITY_DIR = path.join(ROOT, 'test-results', 'security');
const OUT_DIR = path.join(SECURITY_DIR, 'tailwind-dashboard');
const FRONTEND_JSON = path.join(SECURITY_DIR, 'zap-frontend-report.json');
const API_JSON = path.join(SECURITY_DIR, 'zap-api-report.json');

function loadDotenv() {
  try {
    require(path.join(ROOT, 'frontend', 'node_modules', 'dotenv')).config({ path: ENV_PATH });
  } catch {
    try {
      if (fs.existsSync(ENV_PATH)) {
        const raw = fs.readFileSync(ENV_PATH, 'utf8');
        for (const line of raw.split(/\r?\n/)) {
          const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
          if (m && !process.env[m[1]]) {
            let v = m[2].trim();
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
              v = v.slice(1, -1);
            process.env[m[1]] = v;
          }
        }
      }
    } catch { /* ignore */ }
  }
}
loadDotenv();

function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseZapFile(filePath, scanKey) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  Missing: ${filePath}`);
    return { meta: {}, insights: [], alerts: [], scanKey, missing: true };
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const insights = Array.isArray(data.insights) ? data.insights : [];
  const sites = Array.isArray(data.site) ? data.site : data.site ? [data.site] : [];
  const alerts = [];
  for (const site of sites) {
    const metaName = site['@name'] || site.name || '';
    const siteAlerts = site.alerts || [];
    for (const a of siteAlerts) {
      const instances = Array.isArray(a.instances) ? a.instances : [];
      const instanceCount = instances.length || Number.parseInt(String(a.count || '0'), 10) || 0;
      alerts.push({
        scan: scanKey,
        site: metaName,
        pluginid: String(a.pluginid || ''),
        alertRef: String(a.alertRef || ''),
        name: String(a.alert || a.name || 'Unknown'),
        riskcode: Number.parseInt(String(a.riskcode ?? '0'), 10) || 0,
        riskdesc: String(a.riskdesc || ''),
        confidence: String(a.confidence || ''),
        desc: stripHtml(a.desc || ''),
        solution: stripHtml(a.solution || ''),
        reference: stripHtml(a.reference || ''),
        cweid: String(a.cweid || '—'),
        wascid: String(a.wascid || '—'),
        instanceCount,
        instances: instances.map((i) => ({
          uri: i.uri || '',
          method: i.method || '',
          param: i.param || '',
          evidence: String(i.evidence || ''),
          otherinfo: String(i.otherinfo || ''),
        })),
      });
    }
  }
  return {
    meta: {
      programName: data['@programName'],
      version: data['@version'],
      generated: data['@generated'] || data.created || '',
    },
    insights,
    alerts,
    scanKey,
    missing: false,
  };
}

function riskLabel(code) {
  switch (code) {
    case 3:
      return 'High';
    case 2:
      return 'Medium';
    case 1:
      return 'Low';
    default:
      return 'Informational';
  }
}

function aggregate(model) {
  const fe = model.frontend;
  const api = model.api;
  const allAlerts = [...fe.alerts, ...api.alerts];
  const totalFindings = allAlerts.length;
  const totalInstances = allAlerts.reduce((s, a) => s + a.instanceCount, 0);

  const byRiskFindings = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const byRiskInstances = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const a of allAlerts) {
    const c = Math.min(3, Math.max(0, a.riskcode));
    byRiskFindings[c]++;
    byRiskInstances[c] += a.instanceCount;
  }

  const cweMap = new Map();
  for (const a of allAlerts) {
    const id = a.cweid && a.cweid !== '—' ? a.cweid : '—';
    cweMap.set(id, (cweMap.get(id) || 0) + a.instanceCount);
  }
  const cweRows = [...cweMap.entries()].sort((x, y) => y[1] - x[1]).slice(0, 20);

  const scanRisk = (arr) => {
    const o = { 0: 0, 1: 0, 2: 0, 3: 0 };
    for (const a of arr) o[Math.min(3, Math.max(0, a.riskcode))]++;
    return o;
  };
  const feRisk = scanRisk(fe.alerts);
  const apiRisk = scanRisk(api.alerts);

  const topAlerts = [...allAlerts]
    .sort((a, b) => b.instanceCount - a.instanceCount)
    .slice(0, 20);

  const refUrls = new Set();
  for (const a of allAlerts) {
    const refs = String(a.reference).match(/https?:\/\/[^\s<>'"]+/gi) || [];
    refs.forEach((u) => refUrls.add(u.replace(/[.,);]+$/, '')));
  }
  const referencesList = [...refUrls].slice(0, 40);

  const highCount = byRiskFindings[3];
  const medCount = byRiskFindings[2];

  return {
    totalFindings,
    totalInstances,
    byRiskFindings,
    byRiskInstances,
    cweRows,
    feRisk,
    apiRisk,
    topAlerts,
    referencesList,
    allAlerts,
    fe,
    api,
    hasBlockingRisk: highCount > 0 || medCount > 0,
    highCount,
    medCount,
  };
}

// ─── LLM Executive Summary ───────────────────────────────────────────────────

function parseSummaryJson(raw) {
  const tryParse = (str) => {
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
  };
  const direct = tryParse(raw);
  if (direct) return direct;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced?.[1] ? tryParse(fenced[1]) : null;
}

async function generateExecutiveSummary(agg, model) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    console.log('  PERPLEXITY_API_KEY not set — skipping AI executive summary.');
    return { en: '', es: '', pt: '' };
  }
  const llmModel = process.env.PERPLEXITY_MODEL || 'sonar';

  const topNames = agg.topAlerts.slice(0, 8).map((a) => `- ${a.name} (${a.instanceCount} inst., ${riskLabel(a.riskcode)})`);

  const userPrompt = `OWASP ZAP security assessment — TuCreditoOnline (TCO)

Scans:
- Frontend baseline: ${model.frontend.missing ? 'JSON not found' : model.frontend.meta.version || 'ZAP'} · Site: ${model.frontend.alerts[0]?.site || 'N/A'} · Finding types: ${model.frontend.alerts.length}
- API OpenAPI: ${model.api.missing ? 'JSON not found' : model.api.meta.version || 'ZAP'} · Site: ${model.api.alerts[0]?.site || 'N/A'} · Finding types: ${model.api.alerts.length}

Aggregated KPIs:
- Unique finding types (alerts): ${agg.totalFindings}
- Total affected URLs/instances: ${agg.totalInstances}
- By severity (finding types): High=${agg.byRiskFindings[3]}, Medium=${agg.byRiskFindings[2]}, Low=${agg.byRiskFindings[1]}, Informational=${agg.byRiskFindings[0]}

Top findings:
${topNames.join('\n') || '(none)'}

Context: This is a development/staging style scan. Focus on business risk, prioritization, and practical next steps — not raw URLs or exploit code.

`;

  const systemPrompt = `You are a CISO advisor writing executive security summaries for leadership.
Write concise summaries (4-6 short paragraphs each), non-technical, business and risk oriented.
Cover: overall posture, main themes (headers/CORS/caching/etc.), prioritization, and 3-5 actionable recommendations.
Do NOT include HTML, JSON, or long URL lists.
Return ONLY valid JSON: {"en":"...","es":"...","pt":"..."}
Use markdown (**bold**, bullets) inside each string. No code fences.`;

  try {
    console.log(`  Calling Perplexity API (model: ${llmModel})...`);
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 60000);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: llmModel,
        max_tokens: 2200,
        temperature: 0.35,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`  Perplexity error: ${response.status} — ${errText.slice(0, 200)}`);
      return { en: '', es: '', pt: '' };
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    console.log(`  AI response (${data.usage?.total_tokens ?? '?'} tokens).`);
    return parseSummaryJson(content) || { en: content.trim(), es: content.trim(), pt: content.trim() };
  } catch (err) {
    console.warn(`  LLM failed: ${err && err.message ? err.message : String(err)}`);
    return { en: '', es: '', pt: '' };
  }
}

function mdToHtml(md) {
  if (!md) return '';
  return md.split('\n\n').map((block) => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('### ')) return `<h4 class="text-base font-semibold text-slate-700 dark:text-gray-200 mt-3 mb-1">${esc(block.slice(4))}</h4>`;
    if (block.startsWith('## ')) return `<h3 class="text-lg font-semibold text-slate-800 dark:text-white mt-3 mb-2">${esc(block.slice(3))}</h3>`;
    if (block.startsWith('# ')) return `<h2 class="text-xl font-bold text-slate-800 dark:text-white mt-4 mb-2">${esc(block.slice(2))}</h2>`;
    let h = esc(block);
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 dark:text-white">$1</strong>');
    h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
    h = h.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
    if (h.includes('<li')) h = `<ul class="space-y-1 mb-3">${h}</ul>`;
    else h = `<p class="mb-3">${h}</p>`;
    return h;
  }).join('\n');
}

function badgeClass(code) {
  if (code >= 3) return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
  if (code === 2) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800';
  if (code === 1) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
}

function generateHtml(agg, summaryByLang, model) {
  const summaryHtml = {
    en: mdToHtml(summaryByLang.en),
    es: mdToHtml(summaryByLang.es),
    pt: mdToHtml(summaryByLang.pt),
  };
  const summaryJson = JSON.stringify(summaryHtml).replace(/<\/script/g, '<\\/script');

  const feIns = model.frontend.alerts.reduce((s, a) => s + a.instanceCount, 0);
  const apiIns = model.api.alerts.reduce((s, a) => s + a.instanceCount, 0);

  const insightsRows = (insights, scan) =>
    insights
      .slice(0, 30)
      .map(
        (i) => `
    <tr class="hover:bg-slate-50 dark:hover:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800/50">
      <td class="px-3 py-2 text-xs font-mono text-aura-600 dark:text-aura-400">${esc(scan)}</td>
      <td class="px-3 py-2 text-xs">${esc(i.description || i.key)}</td>
      <td class="px-3 py-2 text-xs text-slate-500">${esc(i.level)} / ${esc(i.reason || '')}</td>
      <td class="px-3 py-2 text-xs font-bold text-right">${esc(String(i.statistic ?? ''))}</td>
    </tr>`
      )
      .join('');

  const alertAccordions = agg.allAlerts
    .sort((a, b) => b.riskcode - a.riskcode || b.instanceCount - a.instanceCount)
    .map((a, idx) => {
      const instPreview = a.instances.slice(0, 12);
      const more = a.instances.length - instPreview.length;
      return `
    <div class="bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm mb-3 alert-card" data-scan="${esc(a.scan)}" data-risk="${a.riskcode}" data-q="${esc((a.name + ' ' + a.pluginid + ' ' + a.cweid).toLowerCase())}">
      <button type="button" onclick="toggleAcc(this)" class="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badgeClass(a.riskcode)}">${esc(riskLabel(a.riskcode))}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-800 dark:text-white break-words">${esc(a.name)}</p>
          <p class="text-[10px] text-slate-400 dark:text-gray-500 font-mono mt-0.5">${esc(a.scan)} · plugin ${esc(a.pluginid)} · CWE ${esc(a.cweid)} · ${a.instanceCount} <span data-i18n="lblUrls">URLs</span></p>
        </div>
        <i class="bi bi-chevron-down acc-i transition-transform text-slate-400"></i>
      </button>
      <div class="acc-panel hidden border-t border-slate-100 dark:border-zinc-800">
        <div class="p-4 grid md:grid-cols-2 gap-4 text-xs">
          <div><span class="font-semibold text-slate-600 dark:text-gray-400" data-i18n="lblDesc">Description</span><p class="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">${esc(a.desc.slice(0, 1200))}${a.desc.length > 1200 ? '…' : ''}</p></div>
          <div><span class="font-semibold text-slate-600 dark:text-gray-400" data-i18n="lblSolution">Solution</span><p class="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">${esc(a.solution.slice(0, 1200))}${a.solution.length > 1200 ? '…' : ''}</p></div>
        </div>
        <div class="px-4 pb-4 overflow-x-auto">
          <table class="w-full text-[11px]">
            <thead><tr class="bg-slate-50 dark:bg-zinc-800/60 text-left">
              <th class="px-2 py-1.5 font-semibold text-slate-500" data-i18n="colMethod">Method</th>
              <th class="px-2 py-1.5 font-semibold text-slate-500" data-i18n="colUri">URI</th>
              <th class="px-2 py-1.5 font-semibold text-slate-500" data-i18n="colParam">Param</th>
            </tr></thead>
            <tbody class="divide-y divide-slate-100 dark:divide-zinc-800">
              ${instPreview
                .map(
                  (i) => `
              <tr><td class="px-2 py-1 font-mono">${esc(i.method)}</td><td class="px-2 py-1 font-mono break-all max-w-md">${esc(i.uri)}</td><td class="px-2 py-1">${esc(i.param)}</td></tr>`
                )
                .join('')}
            </tbody>
          </table>
          ${more > 0 ? `<p class="text-[10px] text-slate-400 mt-2 italic"><span data-i18n="lblMoreInstances">Additional instances in source JSON</span>: +${more}</p>` : ''}
        </div>
      </div>
    </div>`;
    })
    .join('');

  const chartPayload = JSON.stringify({
    byRiskFindings: agg.byRiskFindings,
    byRiskInstances: agg.byRiskInstances,
    feRisk: agg.feRisk,
    apiRisk: agg.apiRisk,
    topLabels: agg.topAlerts.slice(0, 12).map((a) => (a.name.length > 42 ? a.name.slice(0, 39) + '…' : a.name)),
    topData: agg.topAlerts.slice(0, 12).map((a) => a.instanceCount),
    feAlerts: model.frontend.alerts.length,
    apiAlerts: model.api.alerts.length,
    feInstances: feIns,
    apiInstances: apiIns,
  }).replace(/</g, '\\u003c');

  const statusBadge = agg.highCount > 0
    ? 'bg-red-500/20 text-red-100 border-red-400/50'
    : agg.medCount > 0
      ? 'bg-amber-500/20 text-amber-100 border-amber-400/50'
      : 'bg-emerald-500/20 text-emerald-100 border-emerald-400/50';
  const statusText =
    agg.highCount > 0 ? 'REVIEW HIGH' : agg.medCount > 0 ? 'REVIEW MEDIUM' : 'LOW RISK PROFILE';

  return `<!DOCTYPE html>
<html lang="es" class="">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>OWASP ZAP — Security Dashboard v2 · TuCreditoOnline</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"><\/script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<script>
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aura: {50:'#eef2ff',100:'#e0e7ff',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3'},
      },
      fontFamily: { sans: ['-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','sans-serif'] },
    }
  }
};
<\/script>
<style>
.tab-btn.active{border-color:#6366f1;color:#6366f1;background:rgba(99,102,241,.08)}
.dark .tab-btn.active{color:#a5b4fc;background:rgba(99,102,241,.15)}
.tab-panel{display:none}.tab-panel.active{display:block}
.search-input:focus{outline:none;border-color:#6366f1}
.acc-i.open{transform:rotate(180deg)}
</style>
</head>
<body class="bg-slate-100 text-slate-800 dark:bg-zinc-950 dark:text-zinc-100 min-h-screen font-sans transition-colors duration-300">

<header class="bg-gradient-to-r from-aura-600 to-indigo-900 dark:from-zinc-900 dark:to-zinc-950 border-b border-indigo-800 dark:border-zinc-800 sticky top-0 z-40">
  <div class="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white text-[10px]">SAI</div>
      <div>
        <h1 class="text-lg font-bold text-white leading-tight" data-i18n="reportTitle">OWASP ZAP — Panel de Seguridad v2</h1>
        <p class="text-xs text-white/70">TuCreditoOnline · JSON → Tailwind · ${esc(new Date().toLocaleString('es-ES'))}</p>
      </div>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
      <span class="px-3 py-1 rounded-full text-xs font-bold border ${statusBadge}">${esc(statusText)}</span>
      <select id="lang-select" onchange="switchLang(this.value)" class="bg-white/10 border border-white/20 text-white text-xs rounded-lg px-2 py-1.5 cursor-pointer">
        <option value="es">🇪🇸 Español</option><option value="en">🇺🇸 English</option><option value="pt">🇧🇷 Português</option>
      </select>
      <button type="button" onclick="toggleTheme()" class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20" title="Theme">
        <i class="bi bi-moon-fill text-sm" id="theme-icon"></i>
      </button>
    </div>
  </div>
</header>

<nav class="bg-slate-200/60 dark:bg-zinc-900/50 border-b border-slate-300 dark:border-zinc-800 overflow-x-auto">
  <div class="max-w-[1600px] mx-auto px-2 flex gap-1">
    <button type="button" data-tab="executive" class="tab-btn flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 border-aura-500 text-aura-700 dark:text-aura-300 whitespace-nowrap active"><i class="bi bi-stars"></i><span data-i18n="tabExec">Resumen ejecutivo</span></button>
    <button type="button" data-tab="overview" class="tab-btn flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 whitespace-nowrap"><i class="bi bi-speedometer2"></i><span data-i18n="tabOverview">Vista general</span></button>
    <button type="button" data-tab="charts" class="tab-btn flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 whitespace-nowrap"><i class="bi bi-bar-chart-steps"></i><span data-i18n="tabCharts">Gráficos</span></button>
    <button type="button" data-tab="scans" class="tab-btn flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 whitespace-nowrap"><i class="bi bi-shield-check"></i><span data-i18n="tabScans">Escaneos</span></button>
    <button type="button" data-tab="findings" class="tab-btn flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 whitespace-nowrap"><i class="bi bi-list-ul"></i><span data-i18n="tabFindings">Hallazgos</span></button>
    <button type="button" data-tab="insights" class="tab-btn flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 whitespace-nowrap"><i class="bi bi-lightning"></i><span data-i18n="tabInsights">Insights ZAP</span></button>
    <button type="button" data-tab="refs" class="tab-btn flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 whitespace-nowrap"><i class="bi bi-link-45deg"></i><span data-i18n="tabRefs">Referencias</span></button>
  </div>
</nav>

<main class="max-w-[1600px] mx-auto px-4 py-6 space-y-6">

<section id="tab-executive" class="tab-panel active">
  <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 rounded-lg bg-aura-100 dark:bg-aura-600/20 flex items-center justify-center"><i class="bi bi-stars text-aura-600 dark:text-aura-400 text-xl"></i></div>
      <div>
        <h2 class="text-xl font-bold text-slate-800 dark:text-white" data-i18n="execTitle">Resumen ejecutivo</h2>
        <p class="text-xs text-slate-500 dark:text-gray-400" data-i18n="execSub">Generado con IA a partir de los JSON de ZAP (Perplexity / .env)</p>
      </div>
    </div>
    <div id="executive-summary-content" class="prose max-w-none text-slate-600 dark:text-slate-300">
      ${summaryHtml.es || '<p class="text-slate-400 italic" data-i18n="noSummary">Configure PERPLEXITY_API_KEY para el resumen IA.</p>'}
    </div>
  </div>
</section>

<section id="tab-overview" class="tab-panel">
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
    <div class="rounded-xl border p-4 bg-aura-50 dark:bg-aura-900/20 border-aura-200 dark:border-aura-800/40">
      <p class="text-[10px] font-semibold text-aura-700 dark:text-aura-300 uppercase tracking-wide" data-i18n="kpiFindingTypes">Tipos de hallazgo</p>
      <p class="text-2xl font-bold text-slate-900 dark:text-white">${agg.totalFindings}</p>
    </div>
    <div class="rounded-xl border p-4 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50">
      <p class="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide" data-i18n="kpiInstances">Instancias / URLs</p>
      <p class="text-2xl font-bold text-slate-900 dark:text-white">${agg.totalInstances}</p>
    </div>
    <div class="rounded-xl border p-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40">
      <p class="text-[10px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide" data-i18n="kpiHigh">Alto</p>
      <p class="text-2xl font-bold">${agg.byRiskFindings[3]}</p>
    </div>
    <div class="rounded-xl border p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40">
      <p class="text-[10px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide" data-i18n="kpiMedium">Medio</p>
      <p class="text-2xl font-bold">${agg.byRiskFindings[2]}</p>
    </div>
    <div class="rounded-xl border p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40">
      <p class="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide" data-i18n="kpiLow">Bajo</p>
      <p class="text-2xl font-bold">${agg.byRiskFindings[1]}</p>
    </div>
    <div class="rounded-xl border p-4 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700">
      <p class="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide" data-i18n="kpiInfo">Informativo</p>
      <p class="text-2xl font-bold">${agg.byRiskFindings[0]}</p>
    </div>
  </div>
  <div class="grid md:grid-cols-3 gap-4 mb-6">
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
      <h3 class="text-xs font-bold text-slate-500 dark:text-gray-400 mb-3 flex items-center gap-2"><i class="bi bi-window"></i> <span data-i18n="widgetFe">Frontend baseline</span></h3>
      <p class="text-3xl font-bold text-slate-800 dark:text-white">${model.frontend.alerts.length}</p>
      <p class="text-xs text-slate-500 mt-1"><span data-i18n="widgetAlerts">alertas</span> · ${feIns} <span data-i18n="lblInst">inst.</span></p>
      <p class="text-[10px] font-mono text-slate-400 mt-2 truncate">${esc(model.frontend.meta.version || '—')}</p>
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
      <h3 class="text-xs font-bold text-slate-500 dark:text-gray-400 mb-3 flex items-center gap-2"><i class="bi bi-hdd-network"></i> <span data-i18n="widgetApi">API OpenAPI</span></h3>
      <p class="text-3xl font-bold text-slate-800 dark:text-white">${model.api.alerts.length}</p>
      <p class="text-xs text-slate-500 mt-1"><span data-i18n="widgetAlerts">alertas</span> · ${apiIns} <span data-i18n="lblInst">inst.</span></p>
      <p class="text-[10px] font-mono text-slate-400 mt-2 truncate">${esc(model.api.meta.version || '—')}</p>
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
      <h3 class="text-xs font-bold text-slate-500 dark:text-gray-400 mb-3 flex items-center gap-2"><i class="bi bi-bug"></i> CWE <span data-i18n="widgetTop">top</span></h3>
      <ul class="text-xs space-y-1 max-h-28 overflow-y-auto">
        ${agg.cweRows.slice(0, 6).map(([id, n]) => `<li class="flex justify-between"><span class="font-mono">CWE-${esc(id)}</span><span class="font-bold">${n}</span></li>`).join('')}
      </ul>
    </div>
  </div>
  <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
    <h3 class="text-sm font-semibold mb-4 text-slate-600 dark:text-gray-300" data-i18n="riskBarTitle">Distribución de severidad (tipos de hallazgo)</h3>
    <div class="flex h-4 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-800">
      ${[3, 2, 1, 0].map((c) => {
        const n = agg.byRiskFindings[c];
        const pct = agg.totalFindings ? (n / agg.totalFindings) * 100 : 0;
        const col = c === 3 ? 'bg-red-500' : c === 2 ? 'bg-amber-500' : c === 1 ? 'bg-blue-500' : 'bg-slate-400';
        return pct > 0 ? `<div class="${col} h-full transition-all" style="width:${pct.toFixed(2)}%" title="${riskLabel(c)}: ${n}"></div>` : '';
      }).join('')}
    </div>
    <div class="flex flex-wrap gap-4 mt-3 text-[10px] text-slate-500">
      <span><span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span><span data-i18n="riskHigh">High</span> ${agg.byRiskFindings[3]}</span>
      <span><span class="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"></span><span data-i18n="riskMedium">Medium</span> ${agg.byRiskFindings[2]}</span>
      <span><span class="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span><span data-i18n="riskLow">Low</span> ${agg.byRiskFindings[1]}</span>
      <span><span class="inline-block w-2 h-2 rounded-full bg-slate-400 mr-1"></span><span data-i18n="riskInfo">Info</span> ${agg.byRiskFindings[0]}</span>
    </div>
  </div>
</section>

<section id="tab-charts" class="tab-panel">
  <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
      <h3 class="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-2" data-i18n="chartFindingsRisk">Hallazgos por severidad</h3>
      <div class="flex justify-center"><canvas id="c-doughnut-findings" height="220"></canvas></div>
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
      <h3 class="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-2" data-i18n="chartInstancesRisk">Instancias por severidad</h3>
      <div class="flex justify-center"><canvas id="c-doughnut-instances" height="220"></canvas></div>
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm md:col-span-2 xl:col-span-1">
      <h3 class="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-2" data-i18n="chartCompareScans">Comparativa escaneos (tipos)</h3>
      <canvas id="c-bar-compare" height="240"></canvas>
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm md:col-span-2">
      <h3 class="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-2" data-i18n="chartTopFindings">Top hallazgos por instancias</h3>
      <canvas id="c-bar-top" height="280"></canvas>
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
      <h3 class="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-2" data-i18n="chartInstancesScan">Instancias por escaneo</h3>
      <canvas id="c-pie-instances-scan" height="240"></canvas></div>
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
      <h3 class="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-2" data-i18n="chartCwe">Top CWE (instancias)</h3>
      <canvas id="c-bar-cwe" height="240"></canvas></div>
  </div>
</section>

<section id="tab-scans" class="tab-panel">
  <div class="grid md:grid-cols-2 gap-6">
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
      <h2 class="text-lg font-bold mb-4 text-slate-800 dark:text-white" data-i18n="scanFeTitle">Escaneo — Frontend</h2>
      <table class="w-full text-xs">
        <tr><td class="py-1 text-slate-500" data-i18n="lblTool">Herramienta</td><td class="font-mono">ZAP ${esc(model.frontend.meta.version || '')}</td></tr>
        <tr><td class="py-1 text-slate-500" data-i18n="lblGenerated">Generado</td><td>${esc(model.frontend.meta.generated || '')}</td></tr>
        <tr><td class="py-1 text-slate-500" data-i18n="lblJson">JSON fuente</td><td class="font-mono break-all text-[10px]">zap-frontend-report.json</td></tr>
      </table>
      <div class="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/40 text-xs" data-i18n="scanFeHint">Baseline pasivo/activo contra la SPA en el puerto configurado.</div>
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
      <h2 class="text-lg font-bold mb-4 text-slate-800 dark:text-white" data-i18n="scanApiTitle">Escaneo — API</h2>
      <table class="w-full text-xs">
        <tr><td class="py-1 text-slate-500" data-i18n="lblTool">Herramienta</td><td class="font-mono">ZAP ${esc(model.api.meta.version || '')}</td></tr>
        <tr><td class="py-1 text-slate-500" data-i18n="lblGenerated">Generado</td><td>${esc(model.api.meta.generated || '')}</td></tr>
        <tr><td class="py-1 text-slate-500" data-i18n="lblJson">JSON fuente</td><td class="font-mono break-all text-[10px]">zap-api-report.json</td></tr>
      </table>
      <div class="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/40 text-xs" data-i18n="scanApiHint">Importación OpenAPI + reglas API de ZAP.</div>
    </div>
  </div>
</section>

<section id="tab-findings" class="tab-panel">
  <div class="flex flex-wrap gap-3 mb-4">
    <input type="search" id="finding-search" class="search-input flex-1 min-w-[200px] bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm" placeholder="Buscar…" data-i18n-placeholder="phSearch" oninput="filterFindings(this.value)">
    <select id="filter-scan" onchange="filterFindings(document.getElementById('finding-search').value)" class="bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs">
      <option value="" data-i18n="optAllScans">Todos los escaneos</option>
      <option value="frontend">frontend</option>
      <option value="api">api</option>
    </select>
    <select id="filter-risk" onchange="filterFindings(document.getElementById('finding-search').value)" class="bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs">
      <option value="" data-i18n="optAllRisk">Todas severidades</option>
      <option value="3">High</option>
      <option value="2">Medium</option>
      <option value="1">Low</option>
      <option value="0">Info</option>
    </select>
  </div>
  <p class="text-xs text-slate-500 mb-3">${agg.allAlerts.length} <span data-i18n="findingTypesTotal">tipos de hallazgo</span> · ${agg.totalInstances} <span data-i18n="instancesTotal">instancias</span></p>
  <div id="findings-list">${alertAccordions}</div>
</section>

<section id="tab-insights" class="tab-panel">
  <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
    <div class="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 font-semibold text-sm" data-i18n="insightsZapTitle">Estadísticas automáticas ZAP (insights)</div>
    <div class="overflow-x-auto max-h-[70vh]">
      <table class="w-full text-left">
        <thead class="bg-slate-50 dark:bg-zinc-800/80 sticky top-0 text-[10px] uppercase text-slate-500">
          <tr><th class="px-3 py-2" data-i18n="colScan">Scan</th><th class="px-3 py-2" data-i18n="colMetric">Métrica</th><th class="px-3 py-2" data-i18n="colLevel">Nivel</th><th class="px-3 py-2 text-right" data-i18n="colValue">Valor</th></tr>
        </thead>
        <tbody class="text-slate-700 dark:text-slate-300">
          ${insightsRows(model.frontend.insights, 'frontend')}
          ${insightsRows(model.api.insights, 'api')}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section id="tab-refs" class="tab-panel">
  <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
    <h2 class="text-lg font-bold mb-4 text-slate-800 dark:text-white" data-i18n="refsTitle">Referencias extraídas</h2>
    <ul class="text-xs space-y-2 break-all">
      ${agg.referencesList.map((u) => `<li><a href="${esc(u)}" class="text-aura-600 dark:text-aura-400 hover:underline" target="_blank" rel="noopener">${esc(u)}</a></li>`).join('')}
    </ul>
  </div>
  <div class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm mt-6">
    <h2 class="text-lg font-bold mb-4 text-slate-800 dark:text-white" data-i18n="cweFullTitle">CWE — recuento completo (top 20)</h2>
    <table class="w-full text-xs">
      <thead><tr class="text-left text-slate-500"><th class="py-2" data-i18n="colCwe">CWE</th><th class="py-2" data-i18n="colInstances">Instancias</th></tr></thead>
      <tbody>
        ${agg.cweRows.map(([id, n]) => `<tr class="border-t border-slate-100 dark:border-zinc-800"><td class="py-2 font-mono">${esc(id)}</td><td class="py-2 font-bold">${n}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</section>

</main>

<footer class="border-t border-slate-200 dark:border-zinc-800 mt-8 py-6 text-center text-xs text-slate-400">
  <p data-i18n="footerTeam">Applied AI Team — Stefanini · Panel v2 homologado con reportes unitarios/funcionales</p>
  <p class="mt-1" data-i18n="footerNote">Fuente: reportes JSON oficiales OWASP ZAP en test-results/security/</p>
</footer>

<script>
const SUMMARY_HTML = ${summaryJson};
const CHART_DATA = ${chartPayload};
const CWE_LABELS = ${JSON.stringify(agg.cweRows.slice(0, 10).map((r) => 'CWE-' + r[0]))};
const CWE_VALUES = ${JSON.stringify(agg.cweRows.slice(0, 10).map((r) => r[1]))};

document.querySelectorAll('.tab-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById('tab-' + b.dataset.tab).classList.add('active');
  });
});

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  const icon = document.getElementById('theme-icon');
  if (document.documentElement.classList.contains('dark')) {
    icon.className = 'bi bi-sun-fill text-sm';
    localStorage.setItem('sec-theme', 'dark');
  } else {
    icon.className = 'bi bi-moon-fill text-sm';
    localStorage.setItem('sec-theme', 'grey');
  }
  updateAllCharts();
}
(function(){
  if (localStorage.getItem('sec-theme') === 'dark') {
    document.documentElement.classList.add('dark');
    document.getElementById('theme-icon').className = 'bi bi-sun-fill text-sm';
  }
})();

function toggleAcc(btn) {
  const panel = btn.nextElementSibling;
  const i = btn.querySelector('.acc-i');
  panel.classList.toggle('hidden');
  if (i) i.classList.toggle('open');
}

function filterFindings(q) {
  q = (q || '').toLowerCase();
  const scan = document.getElementById('filter-scan').value;
  const risk = document.getElementById('filter-risk').value;
  document.querySelectorAll('.alert-card').forEach(card => {
    const okQ = !q || card.dataset.q.includes(q);
    const okS = !scan || card.dataset.scan === scan;
    const okR = !risk || card.dataset.risk === risk;
    card.style.display = (okQ && okS && okR) ? '' : 'none';
  });
}

const i18n = {
  es:{reportTitle:'OWASP ZAP — Panel de Seguridad v2',tabExec:'Resumen ejecutivo',tabOverview:'Vista general',tabCharts:'Gráficos',tabScans:'Escaneos',tabFindings:'Hallazgos',tabInsights:'Insights ZAP',tabRefs:'Referencias',execTitle:'Resumen ejecutivo',execSub:'IA (Perplexity) · datos JSON ZAP',noSummary:'Configure PERPLEXITY_API_KEY en .env del proyecto.',kpiFindingTypes:'Tipos',kpiInstances:'Instancias',kpiHigh:'Alto',kpiMedium:'Medio',kpiLow:'Bajo',kpiInfo:'Info',widgetFe:'Frontend',widgetApi:'API',widgetUi:'Interfaz',widgetAlerts:'alertas',widgetTop:'Top',lblInst:'inst.',lblUrls:'URLs',lblDesc:'Descripción',lblSolution:'Solución',lblMoreInstances:'Más instancias en JSON',colMethod:'Método',colUri:'URI',colParam:'Parámetro',riskBarTitle:'Severidad (tipos)',riskHigh:'Alto',riskMedium:'Medio',riskLow:'Bajo',riskInfo:'Info',chartFindingsRisk:'Hallazgos por severidad',chartInstancesRisk:'Instancias por severidad',chartCompareScans:'Frontend vs API (tipos)',chartTopFindings:'Top por instancias',chartInstancesScan:'Instancias por escaneo',chartCwe:'CWE',scanFeTitle:'Frontend',scanApiTitle:'API',lblTool:'Herramienta',lblGenerated:'Generado',lblJson:'JSON',scanFeHint:'Baseline contra la aplicación web.',scanApiHint:'Escaneo OpenAPI.',findingTypesTotal:'tipos',instancesTotal:'instancias',insightsZapTitle:'Insights',colScan:'Scan',colMetric:'Métrica',colLevel:'Nivel',colValue:'Valor',refsTitle:'Referencias',cweFullTitle:'CWE',colCwe:'CWE',colInstances:'Instancias',footerTeam:'Applied AI Team — Stefanini',footerNote:'Fuente: JSON ZAP en test-results/security/',phSearch:'Buscar hallazgos…',optAllScans:'Todos',optAllRisk:'Todas severidades',lblFeShort:'Front',lblApiShort:'API'},
  en:{reportTitle:'OWASP ZAP — Security Dashboard v2',tabExec:'Executive summary',tabOverview:'Overview',tabCharts:'Charts',tabScans:'Scans',tabFindings:'Findings',tabInsights:'ZAP insights',tabRefs:'References',execTitle:'Executive summary',execSub:'AI (Perplexity) · ZAP JSON data',noSummary:'Set PERPLEXITY_API_KEY in project .env.',kpiFindingTypes:'Finding types',kpiInstances:'Instances',kpiHigh:'High',kpiMedium:'Medium',kpiLow:'Low',kpiInfo:'Info',widgetFe:'Frontend',widgetApi:'API',widgetUi:'UI',widgetAlerts:'alerts',widgetTop:'Top',lblInst:'inst.',lblUrls:'URLs',lblDesc:'Description',lblSolution:'Solution',lblMoreInstances:'More instances in JSON',colMethod:'Method',colUri:'URI',colParam:'Param',riskBarTitle:'Severity (finding types)',riskHigh:'High',riskMedium:'Medium',riskLow:'Low',riskInfo:'Info',chartFindingsRisk:'Findings by severity',chartInstancesRisk:'Instances by severity',chartCompareScans:'Frontend vs API (types)',chartTopFindings:'Top by instances',chartInstancesScan:'Instances by scan',chartCwe:'CWE',scanFeTitle:'Frontend scan',scanApiTitle:'API scan',lblTool:'Tool',lblGenerated:'Generated',lblJson:'JSON',scanFeHint:'Baseline against the web app.',scanApiHint:'OpenAPI-driven scan.',findingTypesTotal:'types',instancesTotal:'instances',insightsZapTitle:'ZAP statistics',colScan:'Scan',colMetric:'Metric',colLevel:'Level',colValue:'Value',refsTitle:'Extracted references',cweFullTitle:'CWE counts',colCwe:'CWE',colInstances:'Instances',footerTeam:'Applied AI Team — Stefanini',footerNote:'Source: ZAP JSON in test-results/security/',phSearch:'Search findings…',optAllScans:'All scans',optAllRisk:'All severities',lblFeShort:'Front',lblApiShort:'API'},
  pt:{reportTitle:'OWASP ZAP — Painel de Segurança v2',tabExec:'Resumo executivo',tabOverview:'Visão geral',tabCharts:'Gráficos',tabScans:'Escaneamentos',tabFindings:'Achados',tabInsights:'Insights ZAP',tabRefs:'Referências',execTitle:'Resumo executivo',execSub:'IA (Perplexity) · dados JSON ZAP',noSummary:'Configure PERPLEXITY_API_KEY no .env.',kpiFindingTypes:'Tipos',kpiInstances:'Instâncias',kpiHigh:'Alto',kpiMedium:'Médio',kpiLow:'Baixo',kpiInfo:'Info',widgetFe:'Frontend',widgetApi:'API',widgetUi:'UI',widgetAlerts:'alertas',widgetTop:'Top',lblInst:'inst.',lblUrls:'URLs',lblDesc:'Descrição',lblSolution:'Solução',lblMoreInstances:'Mais instâncias no JSON',colMethod:'Método',colUri:'URI',colParam:'Parâm.',riskBarTitle:'Severidade (tipos)',riskHigh:'Alto',riskMedium:'Médio',riskLow:'Baixo',riskInfo:'Info',chartFindingsRisk:'Achados por severidade',chartInstancesRisk:'Instâncias por severidade',chartCompareScans:'Front vs API (tipos)',chartTopFindings:'Top por instâncias',chartInstancesScan:'Instâncias por scan',chartCwe:'CWE',scanFeTitle:'Frontend',scanApiTitle:'API',lblTool:'Ferramenta',lblGenerated:'Gerado',lblJson:'JSON',scanFeHint:'Baseline na aplicação web.',scanApiHint:'Scan OpenAPI.',findingTypesTotal:'tipos',instancesTotal:'instâncias',insightsZapTitle:'Insights',colScan:'Scan',colMetric:'Métrica',colLevel:'Nível',colValue:'Valor',refsTitle:'Referências',cweFullTitle:'CWE',colCwe:'CWE',colInstances:'Instâncias',footerTeam:'Applied AI Team — Stefanini',footerNote:'Fonte: JSON ZAP em test-results/security/',phSearch:'Buscar…',optAllScans:'Todos',optAllRisk:'Todas',lblFeShort:'Front',lblApiShort:'API'}
};

function renderExecutive(lang) {
  const el = document.getElementById('executive-summary-content');
  const h = SUMMARY_HTML[lang] || SUMMARY_HTML.en;
  el.innerHTML = h && h.trim() ? h : '<p class="italic text-slate-400">' + (i18n[lang]?.noSummary||'') + '</p>';
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
  renderExecutive(l);
  updateAllCharts(l);
}

function tickC(){return document.documentElement.classList.contains('dark')?'#9ca3af':'#64748b';}
function gridC(){return document.documentElement.classList.contains('dark')?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';}

window._charts = [];
function mkChart(id, cfg) {
  const c = document.getElementById(id);
  if (!c) return null;
  const ch = new Chart(c, cfg);
  window._charts.push(ch);
  return ch;
}

function updateAllCharts(lang) {
  const l = lang || document.getElementById('lang-select').value || 'es';
  const t = i18n[l] || i18n.es;
  const R = CHART_DATA.byRiskFindings;
  const Ri = CHART_DATA.byRiskInstances;
  const labels = [t.riskInfo, t.riskLow, t.riskMedium, t.riskHigh];
  const colors = ['#94a3b8','#3b82f6','#f59e0b','#ef4444'];

  window._charts.forEach(ch => ch.destroy());
  window._charts = [];

  mkChart('c-doughnut-findings', {
    type: 'doughnut',
    data: { labels, datasets: [{ data: [R[0],R[1],R[2],R[3]], backgroundColor: colors, borderWidth: 0 }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: tickC() } } } }
  });
  mkChart('c-doughnut-instances', {
    type: 'doughnut',
    data: { labels, datasets: [{ data: [Ri[0],Ri[1],Ri[2],Ri[3]], backgroundColor: colors, borderWidth: 0 }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: tickC() } } } }
  });
  mkChart('c-bar-compare', {
    type: 'bar',
    data: {
      labels: [t.lblFeShort, t.lblApiShort],
      datasets: [
        { label: t.riskHigh, data: [CHART_DATA.feRisk[3], CHART_DATA.apiRisk[3]], backgroundColor: '#ef4444', borderRadius: 4 },
        { label: t.riskMedium, data: [CHART_DATA.feRisk[2], CHART_DATA.apiRisk[2]], backgroundColor: '#f59e0b', borderRadius: 4 },
        { label: t.riskLow, data: [CHART_DATA.feRisk[1], CHART_DATA.apiRisk[1]], backgroundColor: '#3b82f6', borderRadius: 4 },
        { label: t.riskInfo, data: [CHART_DATA.feRisk[0], CHART_DATA.apiRisk[0]], backgroundColor: '#94a3b8', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: tickC(), boxWidth: 12 } } },
      scales: {
        x: { stacked: true, ticks: { color: tickC() }, grid: { display: false } },
        y: { stacked: true, ticks: { color: tickC() }, grid: { color: gridC() } }
      }
    }
  });
  mkChart('c-bar-top', {
    type: 'bar',
    data: {
      labels: CHART_DATA.topLabels,
      datasets: [{ label: t.colInstances, data: CHART_DATA.topData, backgroundColor: '#6366f1', borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: tickC() }, grid: { color: gridC() } },
        y: { ticks: { color: tickC(), font: { size: 9 } }, grid: { display: false } }
      }
    }
  });
  mkChart('c-pie-instances-scan', {
    type: 'pie',
    data: {
      labels: [t.lblFeShort + ' ('+CHART_DATA.feInstances+')', t.lblApiShort + ' ('+CHART_DATA.apiInstances+')'],
      datasets: [{ data: [CHART_DATA.feInstances, CHART_DATA.apiInstances], backgroundColor: ['#6366f1','#0ea5e9'], borderWidth: 0 }]
    },
    options: { plugins: { legend: { position: 'bottom', labels: { color: tickC() } } } }
  });
  mkChart('c-bar-cwe', {
    type: 'bar',
    data: {
      labels: CWE_LABELS,
      datasets: [{ label: t.colInstances, data: CWE_VALUES, backgroundColor: '#8b5cf6', borderRadius: 4 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: tickC(), maxRotation: 45, minRotation: 45, font: { size: 9 } }, grid: { display: false } },
        y: { ticks: { color: tickC() }, grid: { color: gridC() } }
      }
    }
  });
}

(function initSecDash() {
  const run = () => switchLang(document.getElementById('lang-select').value || 'es');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
<\/script>
</body>
</html>`;
}

function generateMarkdown(agg, model) {
  let md = `# OWASP ZAP — Security Dashboard v2\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Finding types | ${agg.totalFindings} |\n`;
  md += `| Instances | ${agg.totalInstances} |\n`;
  md += `| High / Med / Low / Info | ${agg.byRiskFindings[3]} / ${agg.byRiskFindings[2]} / ${agg.byRiskFindings[1]} / ${agg.byRiskFindings[0]} |\n\n`;
  md += `## Frontend\n- Alerts: ${model.frontend.alerts.length}\n`;
  md += `## API\n- Alerts: ${model.api.alerts.length}\n\n`;
  md += `## Top findings\n`;
  agg.topAlerts.slice(0, 15).forEach((a, i) => {
    md += `${i + 1}. **${a.name}** — ${a.instanceCount} instances (${riskLabel(a.riskcode)})\n`;
  });
  md += `\n> Full interactive report: \`test-results/security/tailwind-dashboard/security-dashboard.html\`\n`;
  return md;
}

async function main() {
  console.log('ZAP Tailwind dashboard v2 — generating…\n');
  if (!fs.existsSync(SECURITY_DIR)) {
    fs.mkdirSync(SECURITY_DIR, { recursive: true });
  }
  const model = {
    frontend: parseZapFile(FRONTEND_JSON, 'frontend'),
    api: parseZapFile(API_JSON, 'api'),
  };
  if (model.frontend.missing && model.api.missing) {
    console.error('No ZAP JSON files found. Run OWASP ZAP scans first.');
    process.exit(1);
  }
  const agg = aggregate(model);
  console.log(`  Findings: ${agg.totalFindings}, Instances: ${agg.totalInstances}`);
  const summary = await generateExecutiveSummary(agg, model);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const htmlPath = path.join(OUT_DIR, 'security-dashboard.html');
  const mdPath = path.join(OUT_DIR, 'security-dashboard.md');
  fs.writeFileSync(htmlPath, generateHtml(agg, summary, model), 'utf8');
  fs.writeFileSync(mdPath, generateMarkdown(agg, model), 'utf8');
  console.log(`\n  HTML → ${htmlPath}`);
  console.log(`  MD   → ${mdPath}\n  Done.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
