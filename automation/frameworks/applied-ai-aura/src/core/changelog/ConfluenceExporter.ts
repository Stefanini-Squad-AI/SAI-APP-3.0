/**
 * AURA — Confluence Exporter (TailwindCSS)
 * Generates a Confluence-style HTML portal with TailwindCSS.
 * Includes changes, improvements, added tests, coverage, and metrics.
 *
 * Naming: changelog-{YYYYMMDD}-v{version}.html
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ChangeEntry, ChangeKind } from '../../types/index';
import { ChangelogRegistry } from './ChangelogRegistry';

// ─── Kind Config ──────────────────────────────────────────────────────────────

const KIND_CFG: Record<ChangeKind, { label: string; icon: string; color: string }> = {
  feature:  { label: 'New Feature', icon: 'bi-rocket-takeoff', color: '#6366f1' },
  fix:      { label: 'Fix',         icon: 'bi-bug',            color: '#ef4444' },
  refactor: { label: 'Refactor',    icon: 'bi-tools',          color: '#8b5cf6' },
  breaking: { label: 'Breaking',    icon: 'bi-exclamation-triangle', color: '#dc2626' },
  docs:     { label: 'Docs',        icon: 'bi-file-text',      color: '#22c55e' },
  perf:     { label: 'Performance', icon: 'bi-lightning-charge', color: '#eab308' },
};

// ─── Exporter ─────────────────────────────────────────────────────────────────

export class ConfluenceExporter {
  private readonly registry = ChangelogRegistry.getInstance();

  constructor(
    private readonly outputDir = 'docs',
    private readonly projectName = 'SAI',
    private readonly version = '1.0.0',
  ) {}

  export(): string {
    const entries = this.registry.getAll();
    const htmlPath = path.join(
      this.outputDir,
      `changelog-${this.datePart()}-v${this.version}.html`,
    );

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const html = this.render(entries);
    fs.writeFileSync(htmlPath, html);
    console.log(`[AURA/Changelog] ✓ Confluence HTML → ${htmlPath}`);
    return htmlPath;
  }

  render(entries: readonly ChangeEntry[]): string {
    const stats    = this.buildStats(entries);
    const grouped  = this.groupByVersion(entries);
    const genDate  = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${this.escape(this.projectName)} — ChangeLog</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            aura: { DEFAULT: '#6366f1' },
          },
          fontFamily: {
            sans: ['-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','sans-serif'],
            mono: ['Fira Code','Cascadia Code','Consolas','monospace'],
          },
        }
      }
    }
  </script>
  <style>
    html { scroll-behavior: smooth; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
    .version-section { scroll-margin-top: 80px; }
    .kind-pill { display: inline-flex; align-items: center; gap: 4px; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
    .entry-card { animation: fadeIn .3s ease-out both; }
    .filter-btn.active { background: #6366f1; color: white; }
    .filter-btn { transition: all .15s; }
    .timeline-dot { position: relative; }
    .timeline-dot::before {
      content: '';
      position: absolute;
      left: -33px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px; height: 12px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 0 3px #18181b, 0 0 0 4px currentColor;
    }
  </style>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen font-sans">

${this.renderConfluenceHeader(genDate, entries.length)}

<div class="container mx-auto px-4 py-8 max-w-7xl flex gap-8">

  <!-- Sidebar -->
  ${this.renderSidebar(stats, grouped, entries)}

  <!-- Main Content -->
  <main class="flex-1 min-w-0">
    ${this.renderStatsPanel(stats, entries)}
    ${this.renderCoveragePanel(entries)}
    ${this.renderFilters()}
    ${this.renderTimeline(grouped)}
  </main>

</div>

${this.renderScript(entries, stats)}
</body>
</html>`;
  }

  // ─── Header ───────────────────────────────────────────────────────────────

  private renderConfluenceHeader(genDate: string, total: number): string {
    return `
<header class="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50 backdrop-blur">
  <div class="container mx-auto px-4 max-w-7xl py-3 flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/25">⚡</div>
      <div>
        <div class="font-bold text-sm">${this.escape(this.projectName)}</div>
        <div class="text-xs text-zinc-500">v${this.version} · Knowledge Base</div>
      </div>
      <div class="hidden sm:block px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xs font-mono">ChangeLog</div>
    </div>
    <div class="flex items-center gap-4 text-xs text-zinc-500">
      <span><i class="bi bi-collection mr-1"></i>${total} records</span>
      <span><i class="bi bi-calendar3 mr-1"></i>${genDate}</span>
      <button onclick="toggleTheme()" class="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition">
        <i class="bi bi-circle-half"></i>
      </button>
    </div>
  </div>
</header>`;
  }

  // ─── Sidebar ──────────────────────────────────────────────────────────────

  private renderSidebar(
    stats: ReturnType<typeof this.buildStats>,
    grouped: Map<string, ChangeEntry[]>,
    _entries: readonly ChangeEntry[],
  ): string {
    const versionLinks = [...grouped.keys()].map((v) =>
      `<a href="#v${v.replaceAll('.', '-')}" class="flex items-center justify-between py-1.5 px-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition text-xs">
        <span class="font-mono">v${v}</span>
        <span class="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">${grouped.get(v)?.length}</span>
      </a>`,
    ).join('');

    const kindItems = Object.entries(stats.byKind).map(([kind, count]) => {
      const cfg = KIND_CFG[kind as ChangeKind];
      return `<div class="flex items-center justify-between py-1.5 text-xs">
        <span style="color:${cfg.color}"><i class="bi ${cfg.icon} mr-1.5"></i>${cfg.label}</span>
        <span class="font-mono text-zinc-500">${count}</span>
      </div>`;
    }).join('');

    return `
<aside class="w-56 shrink-0 hidden lg:block">
  <div class="sticky top-20 flex flex-col gap-4">
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Versions</div>
      <nav class="flex flex-col gap-0.5">${versionLinks}</nav>
    </div>
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">By Type</div>
      ${kindItems}
    </div>
  </div>
</aside>`;
  }

  // ─── Stats Panel ──────────────────────────────────────────────────────────

  private renderStatsPanel(
    stats: ReturnType<typeof this.buildStats>,
    entries: readonly ChangeEntry[],
  ): string {
    const authorCount = new Set(entries.map((e) => e.author)).size;
    const versionCount = new Set(entries.map((e) => e.version)).size;
    const lastChange = entries[0]?.date.slice(0, 10) ?? '—';

    const kpis = [
      { label: 'Total Changes',  value: entries.length, icon: 'bi-collection',    color: '#6366f1' },
      { label: 'Features',       value: stats.byKind['feature'] ?? 0, icon: 'bi-rocket-takeoff', color: '#22c55e' },
      { label: 'Fixes',          value: stats.byKind['fix'] ?? 0,     icon: 'bi-bug',            color: '#ef4444' },
      { label: 'Versions',       value: versionCount,   icon: 'bi-tag',            color: '#8b5cf6' },
      { label: 'Authors',        value: authorCount,    icon: 'bi-people',         color: '#eab308' },
      { label: 'Last Change',    value: lastChange,     icon: 'bi-clock-history',  color: '#6b7280' },
    ];

    const cards = kpis.map(({ label, value, icon, color }) => `
<div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3 hover:border-zinc-700 transition-colors">
  <div class="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0" style="background:${color}18;color:${color}">
    <i class="bi ${icon}"></i>
  </div>
  <div>
    <div class="text-xl font-black" style="color:${color}">${value}</div>
    <div class="text-zinc-500 text-xs">${label}</div>
  </div>
</div>`).join('');

    return `<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">${cards}</div>`;
  }

  // ─── Coverage Panel ───────────────────────────────────────────────────────

  private renderCoveragePanel(entries: readonly ChangeEntry[]): string {
    const kindData = Object.entries(KIND_CFG).map(([kind, cfg]) => ({
      kind,
      label: cfg.label,
      color: cfg.color,
      icon: cfg.icon,
      count: entries.filter((e) => e.kind === kind).length,
    }));

    const total = entries.length || 1;
    const bars = kindData
      .filter((k) => k.count > 0)
      .map(({ label, color, icon, count }) => {
        const pct = Math.round((count / total) * 100);
        return `
<div class="flex items-center gap-3">
  <div class="w-28 text-xs text-zinc-400 shrink-0">
    <i class="bi ${icon} mr-1" style="color:${color}"></i>${label}
  </div>
  <div class="flex-1 bg-zinc-800 rounded-full h-2">
    <div class="h-2 rounded-full transition-all" style="width:${pct}%;background:${color}"></div>
  </div>
  <div class="text-xs font-mono text-zinc-500 w-16 text-right">${count} (${pct}%)</div>
</div>`;
      }).join('');

    return `
<div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
  <h3 class="font-semibold text-sm text-zinc-300 mb-4">
    <i class="bi bi-pie-chart mr-2 text-indigo-500"></i>Distribution by Change Type
  </h3>
  <div class="flex flex-col gap-3">${bars}</div>
</div>`;
  }

  // ─── Filters ──────────────────────────────────────────────────────────────

  private renderFilters(): string {
    const filters = [
      { id: 'all',      label: 'All' },
      { id: 'feature',  label: 'Features' },
      { id: 'fix',      label: 'Fixes' },
      { id: 'refactor', label: 'Refactor' },
      { id: 'breaking', label: 'Breaking' },
      { id: 'docs',     label: 'Docs' },
      { id: 'perf',     label: 'Perf' },
    ];

    const btns = filters.map(({ id, label }) =>
      `<button onclick="filterKind('${id}')" id="filter-${id}"
        class="filter-btn ${id === 'all' ? 'active' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}
               px-3 py-1.5 rounded-lg text-xs font-medium transition">
        ${label}
      </button>`,
    ).join('');

    return `
<div class="flex items-center gap-2 flex-wrap mb-4">
  <span class="text-xs text-zinc-500 mr-1">Filter:</span>
  ${btns}
</div>`;
  }

  // ─── Timeline ─────────────────────────────────────────────────────────────

  private renderTimeline(grouped: Map<string, ChangeEntry[]>): string {
    const sections = [...grouped.entries()].map(([version, entries]) => {
      const anchorId = `v${version.replaceAll('.', '-')}`;
      const cards = entries.map((e) => this.renderEntryCard(e)).join('');

      return `
<section id="${anchorId}" class="version-section mb-10">
  <div class="flex items-center gap-3 mb-4 ml-8">
    <span class="font-black text-2xl">v${version}</span>
    <span class="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-md font-mono">${entries.length} changes</span>
  </div>
  <div class="border-l-2 border-zinc-800 ml-3 pl-8 flex flex-col gap-3">
    ${cards}
  </div>
</section>`;
    });

    return `<div id="timeline">${sections.join('')}</div>`;
  }

  private renderEntryCard(e: ChangeEntry): string {
    const cfg   = KIND_CFG[e.kind];
    const tags  = e.tags.map((t) =>
      `<span class="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-400">${this.escape(t)}</span>`,
    ).join(' ');

    return `
<div class="entry-card bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
     data-kind="${e.kind}">
  <div class="timeline-dot" style="color:${cfg.color}">
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-2">
        <span class="kind-pill px-2 py-1 rounded-md text-xs font-bold" style="background:${cfg.color}18;color:${cfg.color}">
          <i class="bi ${cfg.icon}"></i> ${cfg.label.toUpperCase()}
        </span>
        <span class="text-zinc-200 font-semibold text-sm">${this.escape(e.title)}</span>
      </div>
      <div class="flex items-center gap-2 text-xs text-zinc-500 shrink-0">
        <span class="font-mono">${e.date.slice(0, 10)}</span>
        <span>·</span>
        <span>${this.escape(e.author)}</span>
        <span>·</span>
        <span class="font-mono bg-zinc-800 px-1.5 py-0.5 rounded">v${e.version}</span>
      </div>
    </div>
    <p class="text-zinc-400 text-sm mt-2">${this.escape(e.description)}</p>
    <div class="flex items-center gap-2 mt-3 flex-wrap">
      <span class="text-xs text-zinc-600 font-mono">${this.escape(e.target)}</span>
      ${tags ? `<span class="text-zinc-700">·</span>${tags}` : ''}
    </div>
  </div>
</div>`;
  }

  // ─── Script ───────────────────────────────────────────────────────────────

  private renderScript(_entries: readonly ChangeEntry[], _stats: ReturnType<typeof this.buildStats>): string {

    return `
<script>
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
}

function filterKind(kind) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active', 'bg-indigo-600', 'text-white'));
  document.querySelectorAll('.filter-btn').forEach(b => {
    if (!b.classList.contains('active')) { b.classList.add('bg-zinc-800', 'text-zinc-400'); }
  });
  const btn = document.getElementById('filter-' + kind);
  if (btn) { btn.classList.add('active'); btn.classList.remove('bg-zinc-800','text-zinc-400'); }

  document.querySelectorAll('.entry-card').forEach(card => {
    const show = kind === 'all' || card.dataset.kind === kind;
    card.style.display = show ? '' : 'none';
  });
}

// Ensure initial active button style is correct
document.getElementById('filter-all').classList.add('bg-indigo-600','text-white');
document.querySelectorAll('.filter-btn:not(#filter-all)').forEach(b => b.classList.add('bg-zinc-800','text-zinc-400'));
</script>`;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private buildStats(entries: readonly ChangeEntry[]): {
    total: number;
    byKind: Partial<Record<ChangeKind, number>>;
    byAuthor: Record<string, number>;
  } {
    const byKind: Partial<Record<ChangeKind, number>> = {};
    const byAuthor: Record<string, number> = {};

    for (const e of entries) {
      byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
      byAuthor[e.author] = (byAuthor[e.author] ?? 0) + 1;
    }

    return { total: entries.length, byKind, byAuthor };
  }

  private groupByVersion(entries: readonly ChangeEntry[]): Map<string, ChangeEntry[]> {
    const map = new Map<string, ChangeEntry[]>();
    for (const e of entries) {
      const arr = map.get(e.version) ?? [];
      arr.push(e);
      map.set(e.version, arr);
    }
    return map;
  }

  private datePart(): string {
    return new Date().toISOString().slice(0, 10).replaceAll('-', '');
  }

  private escape(s: string): string {
    return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  }
}

// CLI: ts-node src/core/changelog/ConfluenceExporter.ts
if (require.main === module) {
  const output  = process.env['AURA_DOCS_DIR'] ?? 'docs';
  const project = process.env['AURA_PROJECT_NAME'] ?? 'SAI';
  const version = process.env['AURA_REPORT_VERSION'] ?? '1.0.0';

  const exporter = new ConfluenceExporter(output, project, version);
  exporter.export();
}
