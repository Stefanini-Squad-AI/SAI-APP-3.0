/**
 * AURA — HTML Report Template
 * Professional light-mode report with AI summary and i18n switcher.
 */
import type { AuraReportData, AuraStepData, AuraLogEntry } from './AuraReportCollector';

type LanguageKey = 'en' | 'es' | 'pt';

export function renderAuraHtml(data: AuraReportData): string {
  const startedAt = new Date(data.startTime).toLocaleString('en-US');
  const endedAt = new Date(data.endTime).toLocaleString('en-US');
  const statusClass = data.status === 'PASSED' ? 'status-ok' : 'status-bad';
  const statusKey = data.status === 'PASSED' ? 'statusPassed' : 'statusFailed';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(data.testName)} - AURA Report</title>
  <style>
    :root {
      --bg: #f7f9fc;
      --surface: #ffffff;
      --surface-muted: #f2f5fb;
      --border: #e2e8f0;
      --text: #0f172a;
      --muted: #64748b;
      --primary: #3b82f6;
      --primary-soft: #dbeafe;
      --success: #16a34a;
      --success-soft: #dcfce7;
      --danger: #dc2626;
      --danger-soft: #fee2e2;
      --warning: #d97706;
      --shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at top left, #edf4ff 0%, var(--bg) 40%);
      color: var(--text);
      font-family: Inter, Segoe UI, Arial, sans-serif;
      line-height: 1.45;
      padding: 22px;
    }
    .container { max-width: 1360px; margin: 0 auto; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      box-shadow: var(--shadow);
      margin-bottom: 16px;
    }
    .header {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      justify-content: space-between;
      padding: 18px 20px;
    }
    .brand {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 8px;
    }
    .logo {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, var(--primary), #6366f1);
      color: #fff;
      font-weight: 800;
      font-size: 12px;
    }
    h1 { margin: 0; font-size: 34px; letter-spacing: -0.02em; }
    h2 { margin: 0 0 12px 0; font-size: 31px; letter-spacing: -0.02em; }
    h3 { margin: 0 0 8px 0; font-size: 17px; }
    .subtitle { margin-top: 6px; color: var(--muted); font-size: 15px; }
    .meta { margin-top: 10px; color: var(--muted); font-size: 12px; }
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 11px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid transparent;
    }
    .status-ok {
      color: var(--success);
      background: var(--success-soft);
      border-color: #bbf7d0;
    }
    .status-bad {
      color: var(--danger);
      background: var(--danger-soft);
      border-color: #fecaca;
    }
    .language-switcher {
      border: 1px solid var(--border);
      background: #fff;
      color: var(--text);
      border-radius: 10px;
      padding: 7px 10px;
      font-size: 12px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }
    .nav {
      display: flex;
      gap: 6px;
      padding: 0 10px 10px 10px;
      border-top: 1px solid var(--border);
      margin-top: 8px;
    }
    .tab-btn {
      border: none;
      background: transparent;
      color: var(--muted);
      font-weight: 600;
      font-size: 13px;
      border-radius: 9px;
      padding: 10px 12px;
      cursor: pointer;
    }
    .tab-btn.active {
      color: #1d4ed8;
      background: var(--primary-soft);
    }
    .tab-content { display: none; padding: 16px 20px 20px 20px; }
    .tab-content.active { display: block; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
      gap: 12px;
    }
    .kpi {
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 13px;
    }
    .kpi .label { color: var(--muted); font-size: 12px; margin-bottom: 6px; }
    .kpi .value { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
    .ok { color: var(--success); }
    .bad { color: var(--danger); }
    .warn { color: var(--warning); }
    .section-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-top: 14px;
      overflow: hidden;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 13px 14px;
      border-bottom: 1px solid var(--border);
      background: #fcfdff;
    }
    .section-header h3 { margin: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td {
      border-bottom: 1px solid var(--border);
      padding: 10px 11px;
      text-align: left;
      vertical-align: top;
    }
    th {
      color: var(--muted);
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .04em;
      background: #f8fafc;
    }
    .mono { font-family: Consolas, Menlo, monospace; font-size: 12px; }
    .pill {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 11px;
      border: 1px solid #cbd5e1;
      color: #475569;
      background: #f8fafc;
    }
    .summary-box {
      background: linear-gradient(180deg, #f8fbff 0%, #f4f8ff 100%);
      border: 1px solid #dbeafe;
      border-radius: 12px;
      padding: 14px;
      color: #1e293b;
      margin-top: 10px;
    }
    .summary-box p { margin: 0 0 10px 0; }
    .summary-box p:last-child { margin-bottom: 0; }
    .video-wrap { padding: 12px; }
    video {
      width: 100%;
      max-width: 980px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: #000;
    }
    .empty {
      padding: 16px;
      color: var(--muted);
      font-size: 13px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 12px;
      color: var(--muted);
      padding: 12px 16px 18px 16px;
    }
    @media (max-width: 900px) {
      body { padding: 12px; }
      h1 { font-size: 26px; }
      .header { flex-direction: column; }
      .nav { overflow-x: auto; white-space: nowrap; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div>
          <div class="brand">
            <div class="logo">SAI</div>
            <div>
              <div class="mono">AURA Professional Report</div>
              <div class="mono" style="color:#94a3b8">v${escapeHtml(data.reportVersion)}</div>
            </div>
          </div>
          <h1>${escapeHtml(data.testName)}</h1>
          <div class="subtitle">${escapeHtml(data.featureName)} / ${escapeHtml(data.scenarioName)}</div>
          <div class="meta">
            <span data-i18n="startedAt"></span>: ${startedAt} &nbsp;|&nbsp;
            <span data-i18n="endedAt"></span>: ${endedAt}
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="status-chip ${statusClass}">
            <span data-i18n="${statusKey}"></span>
          </span>
          <select id="lang-select" class="language-switcher" aria-label="Language selector">
            <option value="en">English</option>
            <option value="es">Espanol</option>
            <option value="pt">Portugues</option>
          </select>
        </div>
      </div>

      <div class="nav">
        <button class="tab-btn active" data-tab="tab-summary" data-i18n="tabSummary"></button>
        <button class="tab-btn" data-tab="tab-results" data-i18n="tabResults"></button>
        <button class="tab-btn" data-tab="tab-success" data-i18n="tabSuccessLogs"></button>
        <button class="tab-btn" data-tab="tab-errors" data-i18n="tabErrorLogs"></button>
        <button class="tab-btn" data-tab="tab-video" data-i18n="tabVideo"></button>
      </div>

      <div id="tab-summary" class="tab-content active">
        <div class="grid">
          <div class="kpi"><div class="label" data-i18n="kpiTotalSteps"></div><div class="value">${data.summary.totalSteps}</div></div>
          <div class="kpi"><div class="label" data-i18n="kpiPassed"></div><div class="value ok">${data.summary.passedSteps}</div></div>
          <div class="kpi"><div class="label" data-i18n="kpiFailed"></div><div class="value bad">${data.summary.failedSteps}</div></div>
          <div class="kpi"><div class="label" data-i18n="kpiSkipped"></div><div class="value warn">${data.summary.skippedSteps + data.summary.pendingSteps}</div></div>
          <div class="kpi"><div class="label" data-i18n="kpiSuccessRate"></div><div class="value">${data.summary.successRate}%</div></div>
          <div class="kpi"><div class="label" data-i18n="kpiDuration"></div><div class="value">${formatDuration(data.durationMs)}</div></div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h3 data-i18n="aiAnalysisTitle"></h3>
            <span class="mono" style="color:#64748b" data-i18n="aiGeneratedLabel"></span>
          </div>
          <div class="summary-box">
            ${renderExecutiveSummary(data.executiveSummary)}
          </div>
        </div>
      </div>

      <div id="tab-results" class="tab-content">
        <div class="section-card">
          <div class="section-header">
            <h3 data-i18n="executionDetails"></h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th data-i18n="step"></th>
                <th data-i18n="status"></th>
                <th data-i18n="duration"></th>
                <th data-i18n="error"></th>
              </tr>
            </thead>
            <tbody>
              ${data.steps.map(renderStepRow).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div id="tab-success" class="tab-content">
        <div class="section-card">
          <div class="section-header">
            <h3><span data-i18n="successLogs"></span> (${data.successLogs.length})</h3>
          </div>
          ${renderLogs(data.successLogs)}
        </div>
      </div>

      <div id="tab-errors" class="tab-content">
        <div class="section-card">
          <div class="section-header">
            <h3><span data-i18n="errorLogs"></span> (${data.errorLogs.length})</h3>
          </div>
          ${renderLogs(data.errorLogs)}
        </div>
      </div>

      <div id="tab-video" class="tab-content">
        <div class="section-card">
          <div class="section-header">
            <h3 data-i18n="videoTitle"></h3>
          </div>
          <div class="video-wrap">
            ${data.videoRelPath
              ? `<video controls><source src="${escapeHtml(data.videoRelPath)}" type="video/webm" /></video>`
              : `<div class="empty" data-i18n="videoUnavailable"></div>`}
          </div>
        </div>
      </div>

      <div class="footer">
        <span>AURA / ${escapeHtml(data.tester.name || 'Automation')}</span>
        <span>${escapeHtml(data.browserInfo.name)} ${data.browserInfo.headless ? '(headless)' : ''}</span>
      </div>
    </div>
  </div>

  <script>
    const I18N = ${JSON.stringify(getTranslations())};
    let currentLang = 'en';

    function translatePage() {
      const dict = I18N[currentLang] || I18N.en;
      document.documentElement.setAttribute('lang', currentLang);
      document.querySelectorAll('[data-i18n]').forEach((node) => {
        const key = node.getAttribute('data-i18n');
        if (!key) return;
        node.textContent = dict[key] || I18N.en[key] || key;
      });
    }

    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach((panel) => panel.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        if (tab) {
          const panel = document.getElementById(tab);
          if (panel) panel.classList.add('active');
        }
      });
    });

    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (event) => {
        const target = event.target;
        if (target instanceof HTMLSelectElement) {
          currentLang = target.value;
          translatePage();
        }
      });
    }

    translatePage();
  </script>
</body>
</html>`;
}

function renderExecutiveSummary(summary?: string): string {
  if (!summary || summary.trim().length === 0) {
    return '<p data-i18n="aiUnavailable"></p>';
  }

  return summary
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');
}

function renderStepRow(step: AuraStepData): string {
  const statusClass = step.status === 'passed' ? 'ok' : step.status === 'failed' ? 'bad' : 'warn';
  return `<tr>
    <td class="mono">${step.stepNumber}</td>
    <td><span class="pill">${escapeHtml(step.keyword)}</span> ${escapeHtml(step.text)}</td>
    <td class="${statusClass}">${escapeHtml(step.status.toUpperCase())}</td>
    <td class="mono">${step.durationMs}ms</td>
    <td class="mono">${step.error ? escapeHtml(step.error) : '-'}</td>
  </tr>`;
}

function renderLogs(logs: readonly AuraLogEntry[]): string {
  if (logs.length === 0) return '<div class="empty" data-i18n="noLogsRecorded"></div>';

  return `<table>
    <thead>
      <tr>
        <th data-i18n="time"></th>
        <th data-i18n="level"></th>
        <th data-i18n="element"></th>
        <th data-i18n="action"></th>
        <th data-i18n="message"></th>
        <th data-i18n="details"></th>
      </tr>
    </thead>
    <tbody>
      ${logs.map((log) => `<tr>
        <td class="mono">${new Date(log.timestamp).toLocaleTimeString('en-US')}</td>
        <td>${escapeHtml(log.level)}</td>
        <td>${log.element ? escapeHtml(log.element) : '-'}</td>
        <td>${log.action ? escapeHtml(log.action) : '-'}</td>
        <td>${escapeHtml(log.message)}</td>
        <td class="mono">${log.details ? escapeHtml(log.details) : '-'}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function getTranslations(): Record<LanguageKey, Record<string, string>> {
  return {
    en: {
      startedAt: 'Started',
      endedAt: 'Ended',
      statusPassed: 'PASSED',
      statusFailed: 'FAILED',
      tabSummary: 'Executive Summary',
      tabResults: 'Test Results',
      tabSuccessLogs: 'Success Logs',
      tabErrorLogs: 'Error Logs',
      tabVideo: 'Video',
      kpiTotalSteps: 'Total Steps',
      kpiPassed: 'Passed',
      kpiFailed: 'Failed',
      kpiSkipped: 'Skipped/Pending',
      kpiSuccessRate: 'Success Rate',
      kpiDuration: 'Duration',
      aiAnalysisTitle: 'AI Analysis',
      aiGeneratedLabel: 'Generated with AI',
      aiUnavailable: 'AI analysis is unavailable for this run.',
      executionDetails: 'Execution Details',
      step: 'Step',
      status: 'Status',
      duration: 'Duration',
      error: 'Error',
      successLogs: 'Success Logs',
      errorLogs: 'Error Logs',
      videoTitle: 'Execution Video',
      videoUnavailable: 'No video available for this run.',
      noLogsRecorded: 'No logs recorded.',
      time: 'Time',
      level: 'Level',
      element: 'Element',
      action: 'Action',
      message: 'Message',
      details: 'Details',
    },
    es: {
      startedAt: 'Inicio',
      endedAt: 'Fin',
      statusPassed: 'EXITOSO',
      statusFailed: 'FALLIDO',
      tabSummary: 'Resumen Ejecutivo',
      tabResults: 'Resultados de Pruebas',
      tabSuccessLogs: 'Logs de Exito',
      tabErrorLogs: 'Logs de Error',
      tabVideo: 'Video',
      kpiTotalSteps: 'Pasos Totales',
      kpiPassed: 'Exitosos',
      kpiFailed: 'Fallidos',
      kpiSkipped: 'Omitidos/Pendientes',
      kpiSuccessRate: 'Tasa de Exito',
      kpiDuration: 'Duracion',
      aiAnalysisTitle: 'Analisis de IA',
      aiGeneratedLabel: 'Generado con IA',
      aiUnavailable: 'El analisis de IA no esta disponible en esta ejecucion.',
      executionDetails: 'Detalle de Pasos',
      step: 'Paso',
      status: 'Estado',
      duration: 'Duracion',
      error: 'Error',
      successLogs: 'Logs de Exito',
      errorLogs: 'Logs de Error',
      videoTitle: 'Video de Ejecucion',
      videoUnavailable: 'No hay video disponible para esta ejecucion.',
      noLogsRecorded: 'No se registraron logs.',
      time: 'Hora',
      level: 'Nivel',
      element: 'Elemento',
      action: 'Accion',
      message: 'Mensaje',
      details: 'Detalles',
    },
    pt: {
      startedAt: 'Inicio',
      endedAt: 'Fim',
      statusPassed: 'APROVADO',
      statusFailed: 'FALHOU',
      tabSummary: 'Resumo Executivo',
      tabResults: 'Resultados de Teste',
      tabSuccessLogs: 'Logs de Sucesso',
      tabErrorLogs: 'Logs de Erro',
      tabVideo: 'Video',
      kpiTotalSteps: 'Total de Etapas',
      kpiPassed: 'Aprovadas',
      kpiFailed: 'Falhas',
      kpiSkipped: 'Ignoradas/Pendentes',
      kpiSuccessRate: 'Taxa de Sucesso',
      kpiDuration: 'Duracao',
      aiAnalysisTitle: 'Analise de IA',
      aiGeneratedLabel: 'Gerado com IA',
      aiUnavailable: 'A analise de IA nao esta disponivel nesta execucao.',
      executionDetails: 'Detalhes da Execucao',
      step: 'Etapa',
      status: 'Status',
      duration: 'Duracao',
      error: 'Erro',
      successLogs: 'Logs de Sucesso',
      errorLogs: 'Logs de Erro',
      videoTitle: 'Video de Execucao',
      videoUnavailable: 'Nenhum video disponivel para esta execucao.',
      noLogsRecorded: 'Nenhum log registrado.',
      time: 'Hora',
      level: 'Nivel',
      element: 'Elemento',
      action: 'Acao',
      message: 'Mensagem',
      details: 'Detalhes',
    },
  };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(ms / 60000);
  const sec = Math.round((ms % 60000) / 1000);
  return `${min}m ${sec}s`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
