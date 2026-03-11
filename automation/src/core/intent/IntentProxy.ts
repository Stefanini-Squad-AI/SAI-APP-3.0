/**
 * AURA — Intent Proxy
 * Implements the Proxy design pattern to intercept all intent method calls.
 * Responsibilities:
 *   1. Resolve natural-language targets → concrete selectors (via StrategyRegistry)
 *   2. Execute the corresponding Playwright action (via ActionExecutor)
 *   3. Emit events to the observable pipeline
 *   4. Collect results for reporting
 *
 * The Proxy transparently wraps IntentActions so callers never deal with
 * raw Playwright locators — only with human-readable intent descriptions.
 */
import type { Page } from 'playwright';
import { expect } from '@playwright/test';
import type {
  IntentActions,
  ExpectChain,
  ClickOptions,
  FillOptions,
  WaitForOptions,
  ScrollDirection,
} from './types';
import type { StrategyRegistry } from './StrategyRegistry';
import { AuraActionExecutor, expectMap } from './ActionExecutor';
import type { AuraIntentObservable } from './IntentObservable';
import type {
  IntentResult,
  IntentPayload,
  Selector,
} from '../../types/index';

export class IntentProxy implements IntentActions {
  private readonly executor = new AuraActionExecutor();
  private readonly results: IntentResult[] = [];

  private static _hlEnabled = true;
  private static _hlColor = '#6366f1';
  private static _hlDuration = 1500;

  static configureHighlight(enabled: boolean, color?: string, duration?: number): void {
    IntentProxy._hlEnabled = enabled;
    if (color) IntentProxy._hlColor = color;
    if (duration) IntentProxy._hlDuration = duration;
  }

  constructor(
    private readonly target: string,
    private readonly page: Page,
    private readonly registry: StrategyRegistry,
    private readonly observable: AuraIntentObservable,
  ) {}

  getResults(): readonly IntentResult[] {
    return this.results;
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async resolveTarget(): Promise<Selector> {
    const resolution = await this.registry.resolve(this.target, this.page);
    return resolution.selector;
  }

  /**
   * Highlights the resolved element using Playwright locator API.
   * Works with any selector syntax (CSS, XPath, role=, text=, etc.)
   */
  private async highlightResolved(selector: string, action: string): Promise<void> {
    if (!IntentProxy._hlEnabled) return;
    try {
      const locator = this.page.locator(selector).first();
      if ((await locator.count()) === 0) return;

      console.info(`[AURA/Highlight] ✦ Highlighting: "${selector}" → ${action}`);
      const label = `SAI \u25B8 ${action}`;
      const col = IntentProxy._hlColor;
      const dur = IntentProxy._hlDuration;

      await locator.evaluate(
        (el, opts) => {
          const h = el as HTMLElement;
          const prev = {
            boxShadow: h.style.boxShadow,
            outline: h.style.outline,
            zIndex: h.style.zIndex,
          };

          h.style.boxShadow = `0 0 0 3px ${opts.col}, 0 0 20px ${opts.col}80`;
          h.style.outline = `2px solid ${opts.col}`;
          h.style.zIndex = '9999';
          h.scrollIntoView({ block: 'center', behavior: 'smooth' });

          const tag = document.createElement('div');
          tag.textContent = opts.lbl;
          Object.assign(tag.style, {
            position: 'fixed',
            top: `${Math.max(4, h.getBoundingClientRect().top - 30)}px`,
            left: `${h.getBoundingClientRect().left}px`,
            background: opts.col,
            color: '#fff',
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            zIndex: '10000',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          });
          document.body.appendChild(tag);

          setTimeout(() => {
            h.style.boxShadow = prev.boxShadow;
            h.style.outline = prev.outline;
            h.style.zIndex = prev.zIndex;
            tag.remove();
          }, opts.dur);
        },
        { col, dur, lbl: label },
      );

      await this.page.waitForTimeout(500);
    } catch { /* non-critical: highlight must never break the flow */ }
  }

  private async dispatch(
    payload: Omit<IntentPayload, 'target'>,
  ): Promise<IntentResult> {
    const valueInfo = payload.value ? ` -> value: "${payload.value}"` : '';
    console.info(`[AURA/Intent] ▶ ${payload.action.toUpperCase()} on "${this.target}"${valueInfo}`);

    const resolvedSelector = await this.resolveTarget();

    console.info(`[AURA/Intent] 🎯 Resolved: "${this.target}" -> "${resolvedSelector}"`);

    await this.highlightResolved(resolvedSelector, `${payload.action} "${this.target}"`);

    const fullPayload: IntentPayload = {
      ...payload,
      target: resolvedSelector,
    };

    this.observable.emit({
      type: payload.action,
      payload: fullPayload,
      timestamp: new Date().toISOString(),
    });

    const result = await this.executor.execute(fullPayload, this.page);
    this.results.push(result);

    this.observable.emit({
      type: result.success ? payload.action : 'error',
      payload: fullPayload,
      result,
      timestamp: new Date().toISOString(),
    });

    if (result.success) {
      console.info(`[AURA/Intent] ✓ ${payload.action} on "${this.target}" completed (${result.durationMs}ms)`);
    } else {
      console.error(`[AURA/Intent] ✗ ${payload.action} on "${this.target}" FAILED: ${result.error}`);
      throw new Error(
        `[AURA] Action "${payload.action}" on "${this.target}" failed: ${result.error}`,
      );
    }

    return result;
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  async click(options?: ClickOptions): Promise<IntentResult> {
    return this.dispatch({
      action: 'click',
      options: options as Readonly<Record<string, unknown>> | undefined,
    });
  }

  async fill(value: string, options?: FillOptions): Promise<IntentResult> {
    return this.dispatch({
      action: 'fill',
      value,
      options: options as Readonly<Record<string, unknown>> | undefined,
    });
  }

  async select(value: string | string[]): Promise<IntentResult> {
    return this.dispatch({ action: 'select', value });
  }

  async check(): Promise<IntentResult> {
    return this.dispatch({ action: 'check' });
  }

  async uncheck(): Promise<IntentResult> {
    return this.dispatch({ action: 'uncheck' });
  }

  async hover(): Promise<IntentResult> {
    return this.dispatch({ action: 'hover' });
  }

  async focus(): Promise<IntentResult> {
    return this.dispatch({ action: 'focus' });
  }

  async clear(): Promise<IntentResult> {
    return this.dispatch({ action: 'clear' });
  }

  async press(key: string): Promise<IntentResult> {
    return this.dispatch({ action: 'press', value: key });
  }

  async waitFor(options?: WaitForOptions): Promise<IntentResult> {
    return this.dispatch({
      action: 'waitFor',
      options: options as Readonly<Record<string, unknown>> | undefined,
    });
  }

  async scroll(_direction?: ScrollDirection): Promise<IntentResult> {
    return this.dispatch({ action: 'scroll' });
  }

  async screenshot(path?: string): Promise<IntentResult> {
    return this.dispatch({ action: 'screenshot', value: path });
  }

  async dragTo(targetSelector: string): Promise<IntentResult> {
    return this.dispatch({ action: 'dragTo', value: targetSelector });
  }

  // ─── Expect Chain ─────────────────────────────────────────────────────────

  expect(): ExpectChain {
    const resolveOnce = this.resolveTarget();

    const makeAssertion =
      (assertionKey: string, value?: string | number) =>
      async (): Promise<void> => {
        const selector = await resolveOnce;
        const valueInfo = value !== undefined ? ` (value: "${value}")` : '';
        console.info(`[AURA/Intent] ◆ expect.${assertionKey} on "${this.target}" → "${selector}"${valueInfo}`);

        await this.highlightResolved(selector, `assert ${assertionKey}`);

        const handler = expectMap[assertionKey];
        if (!handler) throw new Error(`Unknown assertion: "${assertionKey}"`);
        await handler(this.page, selector, value);
        console.info(`[AURA/Intent] ✓ ${assertionKey} passed for "${this.target}"`);
      };

    return {
      toBeVisible: makeAssertion('toBeVisible'),
      toBeHidden: makeAssertion('toBeHidden'),
      toBeEnabled: makeAssertion('toBeEnabled'),
      toBeDisabled: makeAssertion('toBeDisabled'),
      toHaveText: (text: string) => makeAssertion('toHaveText', text)(),
      toHaveValue: (val: string) => makeAssertion('toHaveValue', val)(),
      toHaveCount: (n: number) => makeAssertion('toHaveCount', n)(),
      toBeChecked: makeAssertion('toBeChecked'),
    };
  }
}

// ─── Suppress unused import warning (expect used in assertion handlers) ───────
void expect;
