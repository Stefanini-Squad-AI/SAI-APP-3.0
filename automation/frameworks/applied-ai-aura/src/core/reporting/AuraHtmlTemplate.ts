/**
 * AURA — HTML Report Template
 * English-only lightweight report used by AuraReportCollector.
 */
import type { AuraReportData, AuraStepData, AuraLogEntry } from './AuraReportCollector';

export function renderAuraHtml(data: AuraReportData): string {
  const startedAt = new Date(data.startTime).toLocaleString('en-US');
  const endedAt = new Date(data.endTime).toLocaleString('en-US');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(data.testName)} - AURA Report</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0b1020; color: #e5e7eb; margin: 0; padding: 24px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 12px; }
    .kpi { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; }
    .label { color: #9ca3af; font-size: 12px; margin-bottom: 6px; }
    .value { font-size: 22px; font-weight: 700; }
    .ok { color: #34d399; }
    .bad { color: #f87171; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #1f2937; padding: 10px; text-align: left; vertical-align: top; }
    th { color: #9ca3af; font-weight: 600; }
    .mono { font-family: Consolas, monospace; font-size: 12px; }
    video { width: 100%; max-width: 900px; border-radius: 8px; border: 1px solid #1f2937; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; border: 1px solid #374151; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>${escapeHtml(data.testName)}</h1>
      <p>${escapeHtml(data.featureName)} / ${escapeHtml(data.scenarioName)}</p>
      <p class="mono">Version ${escapeHtml(data.reportVersion)} · Started ${startedAt} · Ended ${endedAt}</p>
      <p>Status: <strong class="${data.status === 'PASSED' ? 'ok' : 'bad'}">${data.status}</strong></p>
    </div>

    <div class="grid">
      <div class="kpi"><div class="label">Total Steps</div><div class="value">${data.summary.totalSteps}</div></div>
      <div class="kpi"><div class="label">Passed</div><div class="value ok">${data.summary.passedSteps}</div></div>
      <div class="kpi"><div class="label">Failed</div><div class="value bad">${data.summary.failedSteps}</div></div>
      <div class="kpi"><div class="label">Success Rate</div><div class="value">${data.summary.successRate}%</div></div>
      <div class="kpi"><div class="label">Duration</div><div class="value">${formatDuration(data.durationMs)}</div></div>
    </div>

    <div class="card">
      <h2>Execution Details</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Step</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          ${data.steps.map(renderStepRow).join('')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Success Logs (${data.successLogs.length})</h2>
      ${renderLogs(data.successLogs)}
    </div>

    <div class="card">
      <h2>Error Logs (${data.errorLogs.length})</h2>
      ${renderLogs(data.errorLogs)}
    </div>

    <div class="card">
      <h2>Video</h2>
      ${data.videoRelPath
        ? `<video controls><source src="${escapeHtml(data.videoRelPath)}" type="video/webm" /></video>`
        : '<p>No video available for this run.</p>'}
    </div>
  </div>
</body>
</html>`;
}

function renderStepRow(step: AuraStepData): string {
  const statusClass = step.status === 'passed' ? 'ok' : step.status === 'failed' ? 'bad' : '';
  return `<tr>
    <td class="mono">${step.stepNumber}</td>
    <td><span class="pill">${escapeHtml(step.keyword)}</span> ${escapeHtml(step.text)}</td>
    <td class="${statusClass}">${escapeHtml(step.status.toUpperCase())}</td>
    <td class="mono">${step.durationMs}ms</td>
    <td class="mono">${step.error ? escapeHtml(step.error) : '-'}</td>
  </tr>`;
}

function renderLogs(logs: readonly AuraLogEntry[]): string {
  if (logs.length === 0) return '<p>No logs recorded.</p>';

  return `<table>
    <thead>
      <tr>
        <th>Time</th>
        <th>Level</th>
        <th>Element</th>
        <th>Action</th>
        <th>Message</th>
        <th>Details</th>
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
