/**
 * AURA — Strategy Registry
 * Manages element-resolution strategies in priority order.
 * Implements the Chain-of-Responsibility pattern: each strategy is tried in
 * registration order; the first one that returns a non-null resolution wins.
 */
import type { Page } from 'playwright';
import type {
  ResolutionStrategy,
  StrategyRegistry as IStrategyRegistry,
} from './types';
import type { SemanticResolution, Selector } from '../../types/index';

interface RegisteredStrategy {
  readonly name: string;
  readonly fn: ResolutionStrategy;
}

export class StrategyRegistry implements IStrategyRegistry {
  private readonly strategies: RegisteredStrategy[] = [];

  register(name: string, strategy: ResolutionStrategy): void {
    this.strategies.push({ name, fn: strategy });
  }

  async resolve(target: string, page: Page): Promise<SemanticResolution> {
    console.info(`[AURA/Strategy] ──────────────────────────────────────`);
    console.info(`[AURA/Strategy] Resolving: "${target}"`);

    for (const { name, fn } of this.strategies) {
      console.info(`[AURA/Strategy]   ├─ Trying: ${name}...`);
      try {
        const result = await fn(target, page);
        if (result !== null) {
          console.info(`[AURA/Strategy]   └─ ✓ MATCH by "${name}" → "${result.selector}" (confidence: ${result.confidence})`);
          console.info(`[AURA/Strategy]      ${result.explanation}`);
          return result;
        }
        console.info(`[AURA/Strategy]   │  ✗ No match`);
      } catch (err) {
        console.warn(`[AURA/Strategy]   │  ⚠ Error in "${name}":`, err instanceof Error ? err.message : err);
      }
    }

    console.warn(`[AURA/Strategy]   └─ ⚠ FALLBACK: no strategy resolved "${target}". Using raw selector.`);
    return {
      selector: target as Selector,
      confidence: 0.1,
      strategy: 'heuristic',
      explanation: `No strategy resolved "${target}". Used as raw selector.`,
    };
  }
}

// ─── Built-in Strategies ──────────────────────────────────────────────────────

/** Resolves targets that look like ARIA labels (e.g. "[aria=Submit]") */
export const ariaStrategy: ResolutionStrategy = async (
  target,
  page,
): Promise<SemanticResolution | null> => {
  const ariaMatch = /^\[aria=(.+)\]$/.exec(target);
  if (!ariaMatch) return null;

  const label = ariaMatch[1];
  const selector = `[aria-label="${label}"], [aria-labelledby="${label}"]` as Selector;
  const count = await page.locator(selector).count();
  if (count === 0) return null;

  return {
    selector,
    confidence: 0.95,
    strategy: 'aria',
    explanation: `Resolved via ARIA label: "${label}"`,
  };
};

/**
 * Resolves semantic text patterns like "button:Submit" or "input:Email".
 * Syntax: <role>:<text>
 */
export const semanticStrategy: ResolutionStrategy = async (
  target,
  page,
): Promise<SemanticResolution | null> => {
  const semanticMatch = /^(\w+):(.+)$/.exec(target);
  if (!semanticMatch) return null;

  const [, role, text] = semanticMatch;
  const playwrightRoles = [
    'button', 'link', 'checkbox', 'radio', 'textbox',
    'combobox', 'listbox', 'option', 'menuitem', 'tab',
    'heading', 'img', 'row', 'cell', 'gridcell',
  ];

  if (!playwrightRoles.includes(role.toLowerCase())) return null;

  const locator = page.getByRole(role.toLowerCase() as Parameters<typeof page.getByRole>[0], {
    name: text,
    exact: false,
  });

  const count = await locator.count();
  if (count === 0) return null;

  // Use regex syntax to match exact: false (substring, case-insensitive)
  const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    selector: `role=${role}[name=/${escapedText}/i]` as Selector,
    confidence: 0.9,
    strategy: 'semantic',
    explanation: `Resolved via semantic role: ${role} with name "${text}"`,
  };
};

// ─── CSS selector detection helpers ──────────────────────────────────────────

const HTML_TAGS = new Set([
  'a', 'abbr', 'address', 'article', 'aside', 'audio', 'b', 'blockquote',
  'body', 'br', 'button', 'canvas', 'caption', 'code', 'col', 'colgroup',
  'datalist', 'dd', 'details', 'dialog', 'div', 'dl', 'dt', 'em',
  'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hr', 'i', 'iframe', 'img', 'input', 'label', 'legend',
  'li', 'link', 'main', 'map', 'mark', 'menu', 'meter', 'nav',
  'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress',
  'q', 's', 'section', 'select', 'small', 'span', 'strong', 'sub',
  'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th',
  'thead', 'time', 'tr', 'u', 'ul', 'video',
]);

/** Returns true if target looks like a native CSS/XPath selector (not a human label) */
function looksLikeRawSelector(target: string): boolean {
  if (target.startsWith('#') || target.startsWith('.')) return true;
  if (target.startsWith('[') && target.endsWith(']')) return true;
  if (target.startsWith('//') || target.startsWith('/')) return true;
  if (HTML_TAGS.has(target.toLowerCase())) return true;
  if (/^[a-z][a-z0-9]*[.#\[\s:>+~]/.test(target)) return true;
  return false;
}

/** Heuristic: tries common patterns like placeholders, labels, test-ids, text */
export const heuristicStrategy: ResolutionStrategy = async (
  target,
  page,
): Promise<SemanticResolution | null> => {
  // Phase 0: Raw CSS/XPath selector — use directly, skip strategy chain overhead
  if (looksLikeRawSelector(target)) {
    try {
      const sel = target.startsWith('//') || target.startsWith('/')
        ? `xpath=${target}`
        : target;
      if ((await page.locator(sel).count()) > 0) {
        return {
          selector: sel as Selector,
          confidence: 0.95,
          strategy: 'heuristic',
          explanation: `Resolved as native CSS/XPath selector: "${target}"`,
        };
      }
    } catch { /* not a valid selector — continue to other phases */ }
  }

  // Phase 1: Direct attribute matches (exact, highest confidence)
  const directCandidates: Array<{ selector: string; label: string }> = [
    { selector: `[data-testid="${target}"]`, label: 'data-testid' },
    { selector: `[data-cy="${target}"]`, label: 'data-cy' },
    { selector: `[placeholder="${target}"]`, label: 'placeholder' },
    { selector: `[name="${target}"]`, label: 'name' },
    { selector: `[id="${target}"]`, label: 'id' },
  ];

  for (const { selector, label } of directCandidates) {
    try {
      if ((await page.locator(selector).count()) > 0) {
        return {
          selector: selector as Selector,
          confidence: 0.75,
          strategy: 'heuristic',
          explanation: `Resolved via heuristic (${label}): "${target}"`,
        };
      }
    } catch { continue; }
  }

  // Phase 2: Label-based resolution — finds input/textarea/select associated with a <label>
  try {
    const labelLocator = page.getByLabel(target, { exact: false });
    if ((await labelLocator.count()) > 0) {
      const el = labelLocator.first();
      const id = await el.getAttribute('id');
      if (id) {
        return {
          selector: `#${id}` as Selector,
          confidence: 0.85,
          strategy: 'heuristic',
          explanation: `Resolved via label "${target}" → #${id}`,
        };
      }
      const name = await el.getAttribute('name');
      if (name) {
        return {
          selector: `[name="${name}"]` as Selector,
          confidence: 0.85,
          strategy: 'heuristic',
          explanation: `Resolved via label "${target}" → [name="${name}"]`,
        };
      }
    }
  } catch { /* label resolution not applicable */ }

  // Phase 3: Case-insensitive attribute matches
  const ciCandidates: Array<{ selector: string; label: string }> = [
    { selector: `[placeholder="${target}" i]`, label: 'placeholder (ci)' },
    { selector: `[name="${target}" i]`, label: 'name (ci)' },
    { selector: `[id="${target}" i]`, label: 'id (ci)' },
  ];

  for (const { selector, label } of ciCandidates) {
    try {
      if ((await page.locator(selector).count()) > 0) {
        return {
          selector: selector as Selector,
          confidence: 0.65,
          strategy: 'heuristic',
          explanation: `Resolved via heuristic (${label}): "${target}"`,
        };
      }
    } catch { continue; }
  }

  // Phase 4: Text matching (lowest confidence — may match labels instead of inputs)
  const textCandidates: Array<{ selector: string; label: string }> = [
    { selector: `text="${target}"`, label: 'exact text' },
    { selector: `text=${target}`, label: 'partial text' },
  ];

  for (const { selector, label } of textCandidates) {
    try {
      if ((await page.locator(selector).count()) > 0) {
        return {
          selector: selector as Selector,
          confidence: 0.5,
          strategy: 'heuristic',
          explanation: `Resolved via heuristic (${label}): "${target}"`,
        };
      }
    } catch { continue; }
  }

  return null;
};
