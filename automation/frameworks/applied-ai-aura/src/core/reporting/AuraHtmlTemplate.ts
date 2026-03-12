/**
 * AURA — HTML Report Template v2
 * Self-contained HTML with TailwindCSS, Chart.js, 7 tabs,
 * full i18n (ES/EN/PT), accordion scenarios, Key Statistics,
 * Coverage Overview, Failure Overview, and rich logs.
 */
import type { AuraReportData, AuraStepData, AuraLogEntry } from './AuraReportCollector';

export function renderAuraHtml(data: AuraReportData): string {
  const j = JSON.stringify(data).replace(/<\/script/g, '<\\/script');
  const d = data;
  const summaryByLang = {
    en: d.executiveSummaryByLang?.en ?? d.executiveSummary ?? '',
    es: d.executiveSummaryByLang?.es ?? d.executiveSummary ?? '',
    pt: d.executiveSummaryByLang?.pt ?? d.executiveSummary ?? '',
  };
  const summaryHtmlByLang = {
    en: summaryByLang.en ? mdHtml(summaryByLang.en) : '',
    es: summaryByLang.es ? mdHtml(summaryByLang.es) : '',
    pt: summaryByLang.pt ? mdHtml(summaryByLang.pt) : '',
  };
  const summaryHtmlJson = JSON.stringify(summaryHtmlByLang).replace(/<\/script/g, '<\\/script');
  const fastest = d.steps.length ? Math.min(...d.steps.map(s => s.durationMs)) : 0;
  const slowest = d.steps.length ? Math.max(...d.steps.map(s => s.durationMs)) : 0;
  const avg = d.steps.length ? Math.round(d.durationMs / d.steps.length) : 0;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${e(d.testName)}</title>
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
/* Force light mode */
body{background:#f8fafc!important;color:#0f172a!important}
.bg-gray-950{background:#f8fafc!important}
.bg-gray-900,.bg-gray-900\\/50,.bg-gray-800\\/50,.bg-gray-800\\/30,.bg-gray-800\\/20,.bg-gray-800{background:#ffffff!important}
.border-gray-800,.border-gray-700,.border-gray-700\\/50,.divide-gray-800\\/50>*{border-color:#e2e8f0!important}
.text-gray-200,.text-gray-300,.text-gray-400,.text-gray-500{color:#475569!important}
.text-white{color:#0f172a!important}
.log-row:nth-child(even){background:#f8fafc!important}
.search-input{background:#fff!important;border:1px solid #cbd5e1!important;color:#0f172a!important}
.tab-btn.active{border-color:#3b82f6!important;color:#1d4ed8!important;background:#dbeafe!important}
.tab-btn{color:#475569!important}
.tab-btn:hover{color:#0f172a!important}
.prose,.prose p,.prose li{color:#334155!important}
.prose strong{color:#0f172a!important}
</style>
</head>
<body class="bg-gray-50 text-slate-900 min-h-screen font-sans">

<!-- ═══ HEADER ═══ -->
<header class="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
<div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
  <div class="flex items-center gap-3">
    <div class="w-9 h-9 rounded-lg bg-aura-600 flex items-center justify-center font-bold text-white text-[10px] tracking-tight">SAI</div>
    <div>
      <h1 class="text-lg font-bold text-white leading-tight">${e(d.testName)}</h1>
      <p class="text-xs text-gray-400">${e(d.featureName)} · v${e(d.reportVersion)}</p>
    </div>
  </div>
  <div class="flex items-center gap-4">
    <span class="px-3 py-1 rounded-full text-xs font-bold ${d.status==='PASSED'?'bg-emerald-900/50 text-emerald-300 border border-emerald-700':'bg-red-900/50 text-red-300 border border-red-700'}">${d.status}</span>
    <select id="lang-select" onchange="switchLang(this.value)" class="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5">
      <option value="es">🇪🇸 Español</option><option value="en">🇺🇸 English</option><option value="pt">🇧🇷 Português</option>
    </select>
  </div>
</div>
</header>

<!-- ═══ TABS ═══ -->
<nav class="bg-gray-900/50 border-b border-gray-800 overflow-x-auto">
<div class="max-w-7xl mx-auto px-4 flex gap-1">
  ${tb('executive','bi-file-earmark-text','tabExecutive','Resumen Ejecutivo',true)}
  ${tb('overall','bi-graph-up','tabOverall','Resultados Generales')}
  ${tb('results','bi-list-check','tabResults','Resultados de Pruebas')}
  ${tb('steps','bi-layers','tabSteps','Detalle de Pasos')}
  ${tb('success','bi-check-circle','tabSuccess','Logs de Éxito')}
  ${tb('errors','bi-exclamation-triangle','tabErrors','Logs de Error')}
  ${tb('video','bi-camera-video','tabVideo','Video')}
</div>
</nav>

<main class="max-w-7xl mx-auto px-4 py-6 space-y-6">

<!-- ═══ TAB: EXECUTIVE SUMMARY ═══ -->
<section id="tab-executive" class="tab-panel active">
<div class="bg-gray-900 rounded-xl border border-gray-800 p-6">
  <div class="flex items-center gap-3 mb-4">
    <div class="w-10 h-10 rounded-lg bg-aura-600/20 flex items-center justify-center"><i class="bi bi-stars text-aura-400 text-xl"></i></div>
    <div><h2 class="text-xl font-bold text-white" data-i18n="executiveTitle">Resumen Ejecutivo</h2><p class="text-xs text-gray-400" data-i18n="executiveSubtitle">Generado con Inteligencia Artificial</p></div>
  </div>
  <div id="executive-summary-content" class="prose max-w-none text-slate-700 leading-relaxed">
    ${summaryHtmlByLang.es || '<p class="text-gray-500 italic" data-i18n="noSummary">Resumen ejecutivo no disponible.</p>'}
  </div>
</div>
</section>

<!-- ═══ TAB: OVERALL RESULTS ═══ -->
<section id="tab-overall" class="tab-panel">
  <!-- KPI Cards -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
    ${kpi('bi-collection','kpiTotal','Total',d.summary.totalSteps,'aura')}
    ${kpi('bi-check-circle-fill','kpiPassed','Exitosos',d.summary.passedSteps,'emerald')}
    ${kpi('bi-x-circle-fill','kpiFailed','Fallidos',d.summary.failedSteps,'red')}
    ${kpi('bi-percent','kpiRate','Tasa de Éxito',d.summary.successRate+'%','blue')}
    ${kpi('bi-clock','kpiDuration','Duración',fmtDur(d.durationMs),'amber')}
  </div>

  <!-- Charts -->
  <div class="grid md:grid-cols-2 gap-6 mb-6">
    <div class="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h3 class="text-sm font-semibold text-gray-400 mb-4" data-i18n="chartResults">Resultados</h3>
      <div class="flex justify-center"><canvas id="chart-donut" width="280" height="280"></canvas></div>
      <div class="flex flex-wrap justify-center gap-3 mt-4 text-[10px]">
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span><span data-i18n="lgPassing">Exitosos</span></span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-red-500"></span><span data-i18n="lgFailed">Fallidos</span></span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span><span data-i18n="lgPending">Pendientes</span></span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-gray-500"></span><span data-i18n="lgSkipped">Omitidos</span></span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-slate-600"></span><span data-i18n="lgIgnored">Ignorados</span></span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-orange-500"></span><span data-i18n="lgAborted">Abortados</span></span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-purple-500"></span><span data-i18n="lgBroken">Rotos</span></span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-pink-500"></span><span data-i18n="lgCompromised">Comprometidos</span></span>
      </div>
    </div>
    <div class="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h3 class="text-sm font-semibold text-gray-400 mb-4" data-i18n="chartDuration">Duración por Paso (ms)</h3>
      <canvas id="chart-bar" height="280"></canvas>
    </div>
  </div>

  <!-- Key Statistics -->
  <div class="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
    <h3 class="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2"><i class="bi bi-clipboard-data"></i><span data-i18n="keyStats">Estadísticas Clave</span></h3>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      ${statRow('bi-collection','ksScenarios','Escenarios',1)}
      ${statRow('bi-list-task','ksTestCases','Casos de Prueba',1)}
      ${statRow('bi-play-circle','ksStarted','Inicio de Pruebas',new Date(d.startTime).toLocaleString('es-ES'))}
      ${statRow('bi-stop-circle','ksFinished','Fin de Pruebas',new Date(d.endTime).toLocaleString('es-ES'))}
      ${statRow('bi-hourglass-split','ksTotalDuration','Duración Total',fmtDur(d.durationMs))}
      ${statRow('bi-lightning','ksFastest','Prueba Más Rápida',fmtDur(fastest))}
      ${statRow('bi-hourglass-bottom','ksSlowest','Prueba Más Lenta',fmtDur(slowest))}
      ${statRow('bi-speedometer2','ksAverage','Tiempo Promedio',fmtDur(avg))}
    </div>
  </div>

  <!-- Functional Coverage Overview -->
  <div class="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
    <h3 class="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2"><i class="bi bi-bar-chart-line"></i><span data-i18n="covOverview">Cobertura Funcional</span></h3>
    <canvas id="chart-coverage" height="100"></canvas>
  </div>

  <!-- Functional Coverage Details -->
  <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-6">
    <div class="p-4 border-b border-gray-800"><h3 class="text-sm font-semibold text-gray-400 flex items-center gap-2"><i class="bi bi-table"></i><span data-i18n="covDetails">Detalle de Cobertura Funcional</span></h3></div>
    <table class="w-full text-xs">
      <thead class="bg-gray-800/50"><tr>
        <th class="px-4 py-2 text-left text-gray-400" data-i18n="covFeature">Feature</th>
        <th class="px-4 py-2 text-center text-gray-400" data-i18n="covScenarios">Escenarios</th>
        <th class="px-4 py-2 text-center text-gray-400" data-i18n="covTestCases">Casos</th>
        <th class="px-4 py-2 text-center text-gray-400" data-i18n="covPassRate">% Éxito</th>
        <th class="px-4 py-2 text-center text-gray-400" data-i18n="covResult">Resultado</th>
        <th class="px-4 py-2 text-left text-gray-400" data-i18n="covCoverage">Cobertura</th>
      </tr></thead>
      <tbody>
        <tr class="border-t border-gray-800/50 hover:bg-gray-800/20">
          <td class="px-4 py-3 text-aura-300">${e(d.featureName)}</td>
          <td class="px-4 py-3 text-center text-gray-300">1</td>
          <td class="px-4 py-3 text-center text-gray-300">1</td>
          <td class="px-4 py-3 text-center font-bold ${d.status==='PASSED'?'text-emerald-400':'text-red-400'}">${d.summary.successRate}%</td>
          <td class="px-4 py-3 text-center">${d.status==='PASSED'?'<i class="bi bi-check-circle-fill text-emerald-400"></i>':'<i class="bi bi-x-circle-fill text-red-400"></i>'}</td>
          <td class="px-4 py-3"><div class="w-full bg-gray-800 rounded-full h-2.5"><div class="h-2.5 rounded-full ${d.status==='PASSED'?'bg-emerald-500':'bg-red-500'}" style="width:${d.summary.successRate}%"></div></div></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Test Failure Overview -->
  <div class="bg-gray-900 rounded-xl border border-gray-800 p-6">
    <h3 class="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2"><i class="bi bi-bug"></i><span data-i18n="failOverview">Resumen de Fallos</span></h3>
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <p class="text-xs font-semibold text-gray-300 mb-2" data-i18n="failFrequent">Fallos Más Frecuentes</p>
        ${d.summary.failedSteps>0 ? d.steps.filter(s=>s.status==='failed').map(s=>`<div class="bg-red-950/20 border border-red-900/30 rounded-lg p-3 mb-2"><p class="text-xs text-red-300">${e(s.keyword)} ${e(s.text)}</p><p class="text-[10px] text-red-400/70 mt-1">${e(s.error??'')}</p></div>`).join('') : `<p class="text-xs text-gray-600" data-i18n="noFailures">No se registraron fallos.</p>`}
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-300 mb-2" data-i18n="failUnstable">Features Más Inestables</p>
        ${d.summary.failedSteps>0 ? `<div class="bg-red-950/20 border border-red-900/30 rounded-lg p-3"><p class="text-xs text-red-300">${e(d.featureName)}</p><p class="text-[10px] text-red-400/70 mt-1">${d.summary.failedSteps} paso(s) fallido(s)</p></div>` : `<p class="text-xs text-gray-600" data-i18n="noUnstable">No hay features inestables.</p>`}
      </div>
    </div>
  </div>

  <!-- Info Cards -->
  <div class="grid md:grid-cols-3 gap-4 mt-6">
    <div class="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <p class="text-xs text-gray-500 mb-1" data-i18n="infoScenario">Escenario</p>
      <p class="text-sm text-white font-medium">${e(d.scenarioName)}</p>
      <p class="text-xs text-gray-400 mt-1">${d.tags.map(t=>`<span class="inline-block bg-aura-900/40 text-aura-300 px-2 py-0.5 rounded text-[10px] mr-1 mb-1">${e(t)}</span>`).join('')}</p>
    </div>
    <div class="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <p class="text-xs text-gray-500 mb-1" data-i18n="infoEnvironment">Entorno</p>
      <p class="text-sm text-white"><span data-i18n="envBrowser">Navegador</span>: <span class="text-gray-300">${e(d.browserInfo.name)}</span></p>
      <p class="text-sm text-white">Headless: <span class="text-gray-300">${d.browserInfo.headless?'Sí':'No'}</span></p>
      <p class="text-sm text-white">Viewport: <span class="text-gray-300">${e(d.browserInfo.viewport)}</span></p>
    </div>
    <div class="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <p class="text-xs text-gray-500 mb-1" data-i18n="infoTester">Ejecutor</p>
      <p class="text-sm text-white">${e(d.tester.name)}</p>
      <p class="text-xs text-gray-400">${e(d.tester.email)}</p>
      <p class="text-xs text-gray-500 mt-1">${new Date(d.startTime).toLocaleString('es-ES')}</p>
    </div>
  </div>
</section>

<!-- ═══ TAB: TEST RESULTS ═══ -->
<section id="tab-results" class="tab-panel">
  <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
    <!-- Scenario Accordion Header -->
    <button onclick="toggleAcc(this)" class="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors border-b border-gray-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg ${d.status==='PASSED'?'bg-emerald-900/30':'bg-red-900/30'} flex items-center justify-center">
          <i class="bi ${d.status==='PASSED'?'bi-check-lg text-emerald-400':'bi-x-lg text-red-400'} text-lg"></i>
        </div>
        <div class="text-left">
          <p class="text-sm text-white font-semibold">${e(d.scenarioName)}</p>
          <p class="text-xs text-gray-500">${e(d.featureName)} · ${d.tags.map(t=>`<span class="text-aura-400">${e(t)}</span>`).join(' ')}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        ${badge(d.status==='PASSED'?'passed':'failed')}
        <span class="text-xs text-gray-500 font-mono">${fmtDur(d.durationMs)}</span>
        <i class="bi bi-chevron-right acc-chevron text-gray-500"></i>
      </div>
    </button>
    <!-- Scenario Steps Table (accordion body) -->
    <div class="acc-body">
      <table class="w-full text-sm">
        <thead class="bg-gray-800/50"><tr>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400" data-i18n="colStep">#</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400" data-i18n="colDescription">Descripción</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400" data-i18n="colStatus">Estado</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400" data-i18n="colDuration">Duración</th>
        </tr></thead>
        <tbody class="divide-y divide-gray-800/50">
          ${d.steps.map(s=>`<tr class="hover:bg-gray-800/30 transition-colors"><td class="px-4 py-3 text-gray-400 font-mono text-xs">${s.stepNumber}</td><td class="px-4 py-3"><span class="text-aura-400 font-medium">${e(s.keyword)}</span> ${e(s.text)}</td><td class="px-4 py-3">${badge(s.status)}</td><td class="px-4 py-3 text-xs text-gray-400 font-mono">${s.durationMs}ms</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</section>

<!-- ═══ TAB: STEPS DETAILS ═══ -->
<section id="tab-steps" class="tab-panel">
  <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
    <!-- Scenario Accordion Header -->
    <button onclick="toggleAcc(this)" class="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors border-b border-gray-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg ${d.status==='PASSED'?'bg-emerald-900/30':'bg-red-900/30'} flex items-center justify-center">
          <i class="bi ${d.status==='PASSED'?'bi-check-lg text-emerald-400':'bi-x-lg text-red-400'} text-lg"></i>
        </div>
        <div class="text-left">
          <p class="text-sm text-white font-semibold">${e(d.scenarioName)}</p>
          <p class="text-xs text-gray-500">${d.summary.passedSteps}/${d.summary.totalSteps} <span data-i18n="stepsLabel">pasos exitosos</span> · ${fmtDur(d.durationMs)}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        ${badge(d.status==='PASSED'?'passed':'failed')}
        <i class="bi bi-chevron-right acc-chevron text-gray-500"></i>
      </div>
    </button>
    <!-- Steps cards (accordion body) -->
    <div class="acc-body">
      <div class="p-4 space-y-3">
        ${d.steps.map(s=>stepCard(s,d)).join('')}
      </div>
    </div>
  </div>
</section>

<!-- ═══ TAB: SUCCESS LOGS ═══ -->
<section id="tab-success" class="tab-panel">
  ${richLogs(d.successLogs,'emerald','successEmpty','No se registraron logs de éxito.','successCount','Logs de Éxito')}
</section>

<!-- ═══ TAB: ERROR LOGS ═══ -->
<section id="tab-errors" class="tab-panel">
  ${richLogs(d.errorLogs,'red','errorEmpty','No se registraron errores. ¡Excelente!','errorCount','Logs de Error')}
</section>

<!-- ═══ TAB: VIDEO ═══ -->
<section id="tab-video" class="tab-panel">
<div class="bg-gray-900 rounded-xl border border-gray-800 p-6">
  ${d.videoRelPath
    ? `<video controls class="w-full max-w-4xl mx-auto rounded-lg border border-gray-700 bg-black" preload="metadata" style="width:100%;height:auto;max-height:70vh;object-fit:contain;display:block"><source src="${e(d.videoRelPath)}" type="video/webm"></video>`
    : `<div class="text-center py-16"><i class="bi bi-camera-video-off text-5xl text-gray-700 mb-4 block"></i><p class="text-gray-500" data-i18n="noVideo">No se grabó video para esta ejecución.</p><p class="text-xs text-gray-600 mt-2" data-i18n="noVideoHint">Configura AURA_RECORD_VIDEO=true en .env para habilitar grabación.</p></div>`}
</div>
</section>

</main>

<!-- ═══ FOOTER ═══ -->
<footer class="border-t border-gray-800 mt-8 py-6 text-center text-xs text-gray-500">
  <p class="font-medium text-gray-400" data-i18n="footerMadeBy">Hecho por Applied AI Team</p>
  <p class="mt-1"><span data-i18n="generatedAt">Generado</span> ${new Date(d.endTime).toLocaleString('es-ES')} · v${e(d.reportVersion)}</p>
</footer>

<!-- ═══ MODAL ═══ -->
<div id="modal-overlay" class="fixed inset-0 bg-black/80 z-50 items-center justify-center p-4" onclick="closeModal()">
  <img id="modal-img" src="" alt="Screenshot" class="max-w-full max-h-[90vh] rounded-lg shadow-2xl">
</div>

<!-- ═══ SCRIPTS ═══ -->
<script>
const R=${j};
const SUMMARY_HTML=${summaryHtmlJson};

// Tabs
document.querySelectorAll('.tab-btn').forEach(b=>{b.addEventListener('click',()=>{document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById('tab-'+b.dataset.tab).classList.add('active')})});

// Modal
function openModal(s){document.getElementById('modal-img').src=s;document.getElementById('modal-overlay').classList.add('open')}
function closeModal(){document.getElementById('modal-overlay').classList.remove('open')}

// Accordion
function toggleAcc(btn){const body=btn.nextElementSibling;body.classList.toggle('open');btn.querySelector('.acc-chevron').classList.toggle('open')}
function toggleStep(btn){const body=btn.nextElementSibling;body.classList.toggle('hidden');btn.querySelector('.step-chev').classList.toggle('rotate-90')}

// Log search
function filterLogs(input,tableId){const q=input.value.toLowerCase();document.querySelectorAll('#'+tableId+' tbody tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q)?'':'none'})}

// Charts
const donutCtx=document.getElementById('chart-donut');
if(donutCtx){new Chart(donutCtx,{type:'doughnut',data:{labels:['Passed','Failed','Pending','Skipped'],datasets:[{data:[R.summary.passedSteps,R.summary.failedSteps,R.summary.pendingSteps||0,R.summary.skippedSteps],backgroundColor:['#10b981','#ef4444','#f59e0b','#6b7280'],borderWidth:0,borderRadius:4}]},options:{responsive:false,cutout:'65%',plugins:{legend:{display:false}}}})}
const barCtx=document.getElementById('chart-bar');
if(barCtx){new Chart(barCtx,{type:'bar',data:{labels:R.steps.map(s=>'Step '+s.stepNumber),datasets:[{label:'ms',data:R.steps.map(s=>s.durationMs),backgroundColor:R.steps.map(s=>s.status==='passed'?'#6366f1':'#ef4444'),borderRadius:6,barThickness:28}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#6b7280'},grid:{display:false}},y:{ticks:{color:'#6b7280'},grid:{color:'rgba(255,255,255,.05)'}}}}})}
const covCtx=document.getElementById('chart-coverage');
if(covCtx){new Chart(covCtx,{type:'bar',data:{labels:[R.featureName],datasets:[{label:'Passing',data:[R.summary.passedSteps],backgroundColor:'#bef264',barThickness:30},{label:'Failed',data:[R.summary.failedSteps],backgroundColor:'#fca5a5',barThickness:30}]},options:{indexAxis:'y',responsive:true,plugins:{legend:{position:'bottom',labels:{color:'#9ca3af'}}},scales:{x:{stacked:true,ticks:{color:'#6b7280'},grid:{color:'rgba(255,255,255,.05)'}},y:{stacked:true,ticks:{color:'#9ca3af'},grid:{display:false}}}}})}

// ── i18n ──
const i18n={
es:{reportTitle:'Reporte de Pruebas SAI',footerMadeBy:'Hecho por Applied AI Team',tabExecutive:'Resumen Ejecutivo',tabOverall:'Resultados Generales',tabResults:'Resultados de Pruebas',tabSteps:'Detalle de Pasos',tabSuccess:'Logs de Éxito',tabErrors:'Logs de Error',tabVideo:'Video',executiveTitle:'Resumen Ejecutivo',executiveSubtitle:'Generado con Inteligencia Artificial',noSummary:'Resumen ejecutivo no disponible.',kpiTotal:'Total',kpiPassed:'Exitosos',kpiFailed:'Fallidos',kpiRate:'Tasa de Éxito',kpiDuration:'Duración',chartResults:'Resultados',chartDuration:'Duración por Paso (ms)',lgPassing:'Exitosos',lgFailed:'Fallidos',lgPending:'Pendientes',lgSkipped:'Omitidos',lgIgnored:'Ignorados',lgAborted:'Abortados',lgBroken:'Rotos',lgCompromised:'Comprometidos',keyStats:'Estadísticas Clave',ksScenarios:'Escenarios',ksTestCases:'Casos de Prueba',ksStarted:'Inicio de Pruebas',ksFinished:'Fin de Pruebas',ksTotalDuration:'Duración Total',ksFastest:'Prueba Más Rápida',ksSlowest:'Prueba Más Lenta',ksAverage:'Tiempo Promedio',covOverview:'Cobertura Funcional',covDetails:'Detalle de Cobertura Funcional',covFeature:'Feature',covScenarios:'Escenarios',covTestCases:'Casos',covPassRate:'% Éxito',covResult:'Resultado',covCoverage:'Cobertura',failOverview:'Resumen de Fallos',failFrequent:'Fallos Más Frecuentes',failUnstable:'Features Más Inestables',noFailures:'No se registraron fallos.',noUnstable:'No hay features inestables.',infoScenario:'Escenario',infoEnvironment:'Entorno',infoTester:'Ejecutor',envBrowser:'Navegador',colStep:'#',colDescription:'Descripción',colStatus:'Estado',colDuration:'Duración',stepsLabel:'pasos exitosos',screenshot:'Captura de Pantalla',stepLogs:'Logs del Paso',successEmpty:'No se registraron logs de éxito.',errorEmpty:'No se registraron errores. ¡Excelente!',noVideo:'No se grabó video para esta ejecución.',noVideoHint:'Configura AURA_RECORD_VIDEO=true en .env para habilitar grabación.',generatedAt:'Generado',colTimestamp:'Hora',colElement:'Elemento',colAction:'Acción',colMessage:'Mensaje',colDetails:'Detalles',logTotal:'Total',logLogs:'logs',searchLogs:'Buscar logs...',successCount:'Logs de Éxito',errorCount:'Logs de Error'},
en:{reportTitle:'SAI Test Report',footerMadeBy:'Made by Applied AI Team',tabExecutive:'Executive Summary',tabOverall:'Overall Results',tabResults:'Test Results',tabSteps:'Steps Details',tabSuccess:'Success Logs',tabErrors:'Error Logs',tabVideo:'Video',executiveTitle:'Executive Summary',executiveSubtitle:'AI-Generated Analysis',noSummary:'Executive summary not available.',kpiTotal:'Total',kpiPassed:'Passed',kpiFailed:'Failed',kpiRate:'Success Rate',kpiDuration:'Duration',chartResults:'Results',chartDuration:'Duration per Step (ms)',lgPassing:'Passing',lgFailed:'Failed',lgPending:'Pending',lgSkipped:'Skipped',lgIgnored:'Ignored',lgAborted:'Aborted',lgBroken:'Broken',lgCompromised:'Compromised',keyStats:'Key Statistics',ksScenarios:'Scenarios',ksTestCases:'Test Cases',ksStarted:'Tests Started',ksFinished:'Tests Finished',ksTotalDuration:'Total Duration',ksFastest:'Fastest Test',ksSlowest:'Slowest Test',ksAverage:'Average Execution Time',covOverview:'Functional Coverage Overview',covDetails:'Functional Coverage Details',covFeature:'Feature',covScenarios:'Scenarios',covTestCases:'Test Cases',covPassRate:'% Pass',covResult:'Result',covCoverage:'Coverage',failOverview:'Test Failure Overview',failFrequent:'Most Frequent Failures',failUnstable:'Most Unstable Features',noFailures:'No failures recorded.',noUnstable:'No unstable features.',infoScenario:'Scenario',infoEnvironment:'Environment',infoTester:'Tester',envBrowser:'Browser',colStep:'#',colDescription:'Description',colStatus:'Status',colDuration:'Duration',stepsLabel:'steps passed',screenshot:'Screenshot',stepLogs:'Step Logs',successEmpty:'No success logs recorded.',errorEmpty:'No errors recorded. Excellent!',noVideo:'No video recorded for this execution.',noVideoHint:'Set AURA_RECORD_VIDEO=true in .env to enable recording.',generatedAt:'Generated',colTimestamp:'Time',colElement:'Element',colAction:'Action',colMessage:'Message',colDetails:'Details',logTotal:'Total',logLogs:'logs',searchLogs:'Search logs...',successCount:'Success Logs',errorCount:'Error Logs'},
pt:{reportTitle:'Relatório de Testes SAI',footerMadeBy:'Feito por Applied AI Team',tabExecutive:'Resumo Executivo',tabOverall:'Resultados Gerais',tabResults:'Resultados dos Testes',tabSteps:'Detalhes dos Passos',tabSuccess:'Logs de Sucesso',tabErrors:'Logs de Erro',tabVideo:'Vídeo',executiveTitle:'Resumo Executivo',executiveSubtitle:'Gerado com Inteligência Artificial',noSummary:'Resumo executivo não disponível.',kpiTotal:'Total',kpiPassed:'Aprovados',kpiFailed:'Falhos',kpiRate:'Taxa de Sucesso',kpiDuration:'Duração',chartResults:'Resultados',chartDuration:'Duração por Passo (ms)',lgPassing:'Aprovados',lgFailed:'Falhos',lgPending:'Pendentes',lgSkipped:'Omitidos',lgIgnored:'Ignorados',lgAborted:'Abortados',lgBroken:'Quebrados',lgCompromised:'Comprometidos',keyStats:'Estatísticas Principais',ksScenarios:'Cenários',ksTestCases:'Casos de Teste',ksStarted:'Início dos Testes',ksFinished:'Fim dos Testes',ksTotalDuration:'Duração Total',ksFastest:'Teste Mais Rápido',ksSlowest:'Teste Mais Lento',ksAverage:'Tempo Médio de Execução',covOverview:'Visão Geral de Cobertura Funcional',covDetails:'Detalhes de Cobertura Funcional',covFeature:'Feature',covScenarios:'Cenários',covTestCases:'Casos',covPassRate:'% Sucesso',covResult:'Resultado',covCoverage:'Cobertura',failOverview:'Visão Geral de Falhas',failFrequent:'Falhas Mais Frequentes',failUnstable:'Features Mais Instáveis',noFailures:'Nenhuma falha registrada.',noUnstable:'Nenhuma feature instável.',infoScenario:'Cenário',infoEnvironment:'Ambiente',infoTester:'Executor',envBrowser:'Navegador',colStep:'#',colDescription:'Descrição',colStatus:'Status',colDuration:'Duração',stepsLabel:'passos aprovados',screenshot:'Captura de Tela',stepLogs:'Logs do Passo',successEmpty:'Nenhum log de sucesso registrado.',errorEmpty:'Nenhum erro registrado. Excelente!',noVideo:'Nenhum vídeo gravado para esta execução.',noVideoHint:'Configure AURA_RECORD_VIDEO=true em .env para habilitar gravação.',generatedAt:'Gerado',colTimestamp:'Hora',colElement:'Elemento',colAction:'Ação',colMessage:'Mensagem',colDetails:'Detalhes',logTotal:'Total',logLogs:'logs',searchLogs:'Buscar logs...',successCount:'Logs de Sucesso',errorCount:'Logs de Erro'}
};
function renderExecutiveSummary(lang){
  const container=document.getElementById('executive-summary-content');
  if(!container) return;
  const html = SUMMARY_HTML[lang] || SUMMARY_HTML.en || '';
  if(html && html.trim()){
    container.innerHTML = html;
  }else{
    const t=i18n[lang]||i18n.es;
    container.innerHTML = '<p class="text-gray-500 italic">'+(t.noSummary||'Summary unavailable')+'</p>';
  }
}
function switchLang(l){
  const t=i18n[l]||i18n.es;
  document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.getAttribute('data-i18n');if(t[k])el.textContent=t[k]});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const k=el.getAttribute('data-i18n-placeholder');if(t[k])el.placeholder=t[k]});
  document.documentElement.lang=l;
  renderExecutiveSummary(l);
}
switchLang(document.getElementById('lang-select')?.value || 'es');
<\/script>
</body></html>`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function e(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function mdHtml(md: string): string {
  return md.split('\n\n').map(b => {
    b = b.trim(); if (!b) return '';
    if (b.startsWith('# '))   return `<h2 class="text-xl font-bold text-white mt-4 mb-2">${e(b.slice(2))}</h2>`;
    if (b.startsWith('## '))  return `<h3 class="text-lg font-semibold text-white mt-3 mb-2">${e(b.slice(3))}</h3>`;
    if (b.startsWith('### ')) return `<h4 class="text-base font-semibold text-gray-200 mt-3 mb-1">${e(b.slice(4))}</h4>`;
    let h = e(b);
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>');
    h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
    return `<p class="mb-3">${h}</p>`;
  }).join('\n');
}

function fmtDur(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms/1000).toFixed(1)}s`;
  const m = Math.floor(ms/60000); const s = Math.round((ms%60000)/1000);
  return `${m}m ${s}s`;
}

function tb(id: string, icon: string, key: string, label: string, active = false): string {
  return `<button data-tab="${id}" class="tab-btn flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 ${active?'border-aura-500 text-aura-300 bg-aura-500/10':'border-transparent text-gray-400 hover:text-gray-200'} transition-colors whitespace-nowrap"><i class="bi ${icon}"></i><span data-i18n="${key}">${label}</span></button>`;
}

function kpi(icon: string, key: string, label: string, val: string|number, color: string): string {
  const cm: Record<string,string> = { aura:'bg-aura-900/30 border-aura-800/50 text-aura-300', emerald:'bg-emerald-900/30 border-emerald-800/50 text-emerald-300', red:'bg-red-900/30 border-red-800/50 text-red-300', blue:'bg-blue-900/30 border-blue-800/50 text-blue-300', amber:'bg-amber-900/30 border-amber-800/50 text-amber-300' };
  return `<div class="rounded-xl border p-4 ${cm[color]??cm.aura}"><div class="flex items-center gap-2 mb-2"><i class="bi ${icon} text-lg"></i><span class="text-xs font-medium" data-i18n="${key}">${label}</span></div><p class="text-2xl font-bold text-white">${val}</p></div>`;
}

function statRow(icon: string, key: string, label: string, val: string|number): string {
  return `<div class="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30"><i class="bi ${icon} text-gray-500"></i><div class="flex-1"><p class="text-xs text-gray-400" data-i18n="${key}">${label}</p></div><p class="text-sm font-semibold text-white">${val}</p></div>`;
}

function badge(status: string): string {
  const m: Record<string,string> = { passed:'bg-emerald-900/40 text-emerald-300 border-emerald-700', failed:'bg-red-900/40 text-red-300 border-red-700', skipped:'bg-gray-800 text-gray-400 border-gray-600', pending:'bg-amber-900/40 text-amber-300 border-amber-700' };
  return `<span class="px-2 py-0.5 rounded text-[10px] font-bold border ${m[status]??m.skipped}">${status.toUpperCase()}</span>`;
}

function logClr(level: string): string {
  const m: Record<string,string> = { INFO:'text-gray-400', SUCCESS:'text-emerald-400', ERROR:'text-red-400', WARNING:'text-amber-400' };
  return m[level] ?? 'text-gray-400';
}

function stepCard(s: AuraStepData, d: AuraReportData): string {
  const statusCls = s.status==='passed'?'bg-emerald-900/40 text-emerald-400':s.status==='failed'?'bg-red-900/40 text-red-400':'bg-gray-800 text-gray-400';
  return `<div class="bg-gray-800/30 rounded-xl border border-gray-800 overflow-hidden">
<button onclick="toggleStep(this)" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
  <div class="flex items-center gap-3">
    <span class="w-7 h-7 rounded-lg ${statusCls} flex items-center justify-center font-bold text-xs">${s.stepNumber}</span>
    <div class="text-left">
      <p class="text-sm text-white"><span class="text-aura-400 font-semibold">${e(s.keyword)}</span> ${e(s.text)}</p>
      <p class="text-xs text-gray-500">${s.durationMs}ms · ${new Date(d.startTime).toLocaleTimeString('es-ES')}</p>
    </div>
  </div>
  <div class="flex items-center gap-2">${badge(s.status)}<i class="bi bi-chevron-right step-chev text-gray-500 transition-transform duration-200"></i></div>
</button>
<div class="hidden border-t border-gray-700/50">
  <div class="p-4 space-y-4">
    ${s.error?`<div class="bg-red-950/30 border border-red-900/50 rounded-lg p-3"><p class="text-xs text-red-400 font-mono break-all">${e(s.error)}</p></div>`:''}
    ${s.screenshotPath?`<div><p class="text-xs text-gray-500 mb-2" data-i18n="screenshot">Captura de Pantalla</p><img src="${e(s.screenshotPath)}" alt="Step ${s.stepNumber}" class="screenshot-thumb max-w-xl rounded-lg border border-gray-700" onclick="openModal(this.src)"></div>`:''}
    ${s.logs.length>0?`<div><p class="text-xs text-gray-500 mb-2" data-i18n="stepLogs">Logs del Paso</p><div class="space-y-1 text-xs font-mono">${s.logs.map(l=>`<div class="log-row px-2 py-1 rounded ${logClr(l.level)}">[${new Date(l.timestamp).toLocaleTimeString('es-ES')}] ${l.element?'<span class="text-aura-300">'+e(l.element)+'</span> · ':''}${l.action?'<span class="text-gray-300">'+e(l.action)+'</span> · ':''}${e(l.message)}${l.details?' — <span class="text-gray-500">'+e(l.details)+'</span>':''}</div>`).join('')}</div></div>`:''}
  </div>
</div></div>`;
}

function richLogs(logs: readonly AuraLogEntry[], color: string, emptyKey: string, emptyText: string, countKey: string, title: string): string {
  if (logs.length === 0) {
    return `<div class="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center"><i class="bi ${color==='emerald'?'bi-check-circle':'bi-shield-check'} text-4xl text-gray-700 mb-3 block"></i><p class="text-gray-500" data-i18n="${emptyKey}">${emptyText}</p></div>`;
  }
  const tableId = `log-table-${color}`;
  return `<div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
<div class="p-4 border-b border-gray-800 flex items-center justify-between">
  <div class="flex items-center gap-2"><i class="bi ${color==='emerald'?'bi-check-circle':'bi-exclamation-triangle'} text-${color}-400"></i><h3 class="text-sm font-semibold text-gray-300" data-i18n="${countKey}">${title}</h3><span class="text-xs text-gray-500"><span data-i18n="logTotal">Total</span>: ${logs.length} <span data-i18n="logLogs">logs</span></span></div>
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
    ${logs.map(l=>`<tr class="log-row hover:bg-gray-800/20"><td class="px-4 py-2 text-gray-500 font-mono whitespace-nowrap">${new Date(l.timestamp).toLocaleTimeString('es-ES')}</td><td class="px-4 py-2 text-gray-300">${l.element?e(l.element):'—'}</td><td class="px-4 py-2 text-gray-400">${l.action?e(l.action):'—'}</td><td class="px-4 py-2 text-${color}-300">${e(l.message)}</td><td class="px-4 py-2 text-gray-500 max-w-xs truncate">${l.details?e(l.details):'—'}</td></tr>`).join('')}
  </tbody>
</table></div>`;
}
