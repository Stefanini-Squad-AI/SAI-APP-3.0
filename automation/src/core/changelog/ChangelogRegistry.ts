/**
 * AURA — Changelog Registry
 * Singleton store for all @AuraChange decorated entries.
 * Exposes query, export, and Confluence-style markdown generation.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { ChangeEntry, ChangeKind } from '../../types/index';

// ─── Query Filter ─────────────────────────────────────────────────────────────

export interface ChangelogFilter {
  readonly kind?: ChangeKind;
  readonly version?: string;
  readonly author?: string;
  readonly tag?: string;
  readonly since?: string;
}

// ─── Singleton Registry ───────────────────────────────────────────────────────

export class ChangelogRegistry {
  private static instance: ChangelogRegistry | null = null;
  private readonly entries: ChangeEntry[] = [];

  private constructor() {}

  static getInstance(): ChangelogRegistry {
    if (!ChangelogRegistry.instance) {
      ChangelogRegistry.instance = new ChangelogRegistry();
    }
    return ChangelogRegistry.instance;
  }

  register(entry: ChangeEntry): void {
    this.entries.push(entry);
  }

  getAll(): readonly ChangeEntry[] {
    return [...this.entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  query(filter: ChangelogFilter): readonly ChangeEntry[] {
    return this.getAll().filter((entry) => {
      if (filter.kind && entry.kind !== filter.kind) return false;
      if (filter.version && entry.version !== filter.version) return false;
      if (filter.author && entry.author !== filter.author) return false;
      if (filter.tag && !entry.tags.includes(filter.tag)) return false;
      if (filter.since && new Date(entry.date) < new Date(filter.since)) return false;
      return true;
    });
  }

  // ─── Export Formats ────────────────────────────────────────────────────────

  toJSON(): string {
    return JSON.stringify(this.getAll(), null, 2);
  }

  toMarkdown(): string {
    const grouped = this.groupByVersion();
    const lines: string[] = ['# AURA — Change Log\n'];

    for (const [version, entries] of grouped) {
      lines.push(`## v${version}\n`);
      for (const entry of entries) {
        const badge = this.kindBadge(entry.kind);
        const date = entry.date.slice(0, 10);
        lines.push(`### ${badge} ${entry.title}`);
        lines.push(`> **${date}** · *${entry.author}* · \`${entry.target}\``);
        lines.push('');
        lines.push(entry.description);
        if (entry.tags.length > 0) {
          lines.push('');
          lines.push(`**Tags:** ${entry.tags.map((t) => `\`${t}\``).join(', ')}`);
        }
        lines.push('\n---\n');
      }
    }

    return lines.join('\n');
  }

  /** Confluence-style HTML export */
  toConfluenceHTML(): string {
    const entries = this.getAll();
    const rows = entries
      .map(
        (e) => `
      <tr>
        <td><span class="badge badge-${e.kind}">${e.kind.toUpperCase()}</span></td>
        <td><strong>${this.escapeHTML(e.title)}</strong><br/><small>${this.escapeHTML(e.target)}</small></td>
        <td>${this.escapeHTML(e.description)}</td>
        <td><code>${e.version}</code></td>
        <td>${e.author}</td>
        <td>${e.date.slice(0, 10)}</td>
        <td>${e.tags.map((t) => `<code>${t}</code>`).join(' ')}</td>
      </tr>`,
      )
      .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>AURA ChangeLog</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #e0e0e0; padding: 2rem; }
    h1 { font-size: 1.8rem; color: #fff; }
    table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
    th { background: #1a1a1a; padding: .75rem 1rem; text-align: left; font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; color: #888; }
    td { padding: .75rem 1rem; border-bottom: 1px solid #222; font-size: .9rem; vertical-align: top; }
    code { background: #1e1e1e; padding: .1rem .3rem; border-radius: 3px; font-family: 'Fira Code', monospace; }
    .badge { display: inline-block; padding: .2rem .5rem; border-radius: 4px; font-size: .7rem; font-weight: 700; }
    .badge-feature { background: #0d5bc4; color: #fff; }
    .badge-fix { background: #c44d0d; color: #fff; }
    .badge-refactor { background: #5a0dc4; color: #fff; }
    .badge-breaking { background: #c40d0d; color: #fff; }
    .badge-docs { background: #0d9c4d; color: #fff; }
    .badge-perf { background: #9c7d0d; color: #fff; }
  </style>
</head>
<body>
  <h1>⚡ AURA ChangeLog</h1>
  <p style="color:#666">${entries.length} registered changes</p>
  <table>
    <thead>
      <tr><th>Type</th><th>Title / Target</th><th>Description</th><th>Version</th><th>Author</th><th>Date</th><th>Tags</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`.trim();
  }

  /** Write all outputs to the docs directory */
  export(outputDir = 'docs'): void {
    const dir = path.resolve(process.cwd(), outputDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, 'changelog.json'), this.toJSON());
    fs.writeFileSync(path.join(dir, 'changelog.md'), this.toMarkdown());
    fs.writeFileSync(path.join(dir, 'changelog.html'), this.toConfluenceHTML());
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private groupByVersion(): Map<string, ChangeEntry[]> {
    const map = new Map<string, ChangeEntry[]>();
    for (const entry of this.getAll()) {
      const group = map.get(entry.version) ?? [];
      group.push(entry);
      map.set(entry.version, group);
    }
    return map;
  }

  private kindBadge(kind: ChangeKind): string {
    const badges: Record<ChangeKind, string> = {
      feature: '🚀',
      fix: '🐛',
      refactor: '🔧',
      breaking: '💥',
      docs: '📝',
      perf: '⚡',
    };
    return badges[kind];
  }

  private escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// CLI entrypoint: `ts-node src/core/changelog/ChangelogRegistry.ts`
if (require.main === module) {
  ChangelogRegistry.getInstance().export();
  console.log('[AURA] Changelog exported to /docs');
}
