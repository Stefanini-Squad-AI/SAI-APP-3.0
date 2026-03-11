/**
 * AURA — Intent Builder (Factory)
 * Factory pattern entry point for the Intent-driven API.
 *
 * Usage:
 *   const I = IntentBuilder.for(page);
 *   await I.on('button:Login').click();
 *   await I.navigate('https://example.com');
 *   await I.on('input:Email').fill('user@example.com');
 *   await I.on('button:Submit').expect().toBeVisible();
 */
import type { Page } from 'playwright';
import { IntentProxy } from './IntentProxy';
import {
  StrategyRegistry,
  ariaStrategy,
  semanticStrategy,
  heuristicStrategy,
} from './StrategyRegistry';
import { AuraIntentObservable } from './IntentObservable';
import type { IntentActions, IntentChain } from './types';
import type { IntentResult } from '../../types/index';

export class IntentBuilder implements IntentChain {
  private static readonly defaultRegistry = IntentBuilder.buildDefaultRegistry();
  private readonly proxies: IntentProxy[] = [];

  private constructor(
    private readonly page: Page,
    private readonly registry: StrategyRegistry,
    private readonly observable: AuraIntentObservable,
  ) {}

  // ─── Factory Methods ─────────────────────────────────────────────────────────

  /**
   * Creates an IntentBuilder instance for the given page.
   * By default the standard resolution strategies are registered.
   */
  static for(
    page: Page,
    observable?: AuraIntentObservable,
  ): IntentBuilder {
    return new IntentBuilder(
      page,
      IntentBuilder.defaultRegistry,
      observable ?? new AuraIntentObservable(),
    );
  }

  /**
   * Creates an IntentBuilder with a custom strategy registry.
   * Use this to inject the CognitiveScanner AI strategy.
   */
  static withRegistry(
    page: Page,
    registry: StrategyRegistry,
    observable?: AuraIntentObservable,
  ): IntentBuilder {
    return new IntentBuilder(
      page,
      registry,
      observable ?? new AuraIntentObservable(),
    );
  }

  // ─── Fluent API ──────────────────────────────────────────────────────────────

  /** Target an element using natural language or strategy syntax */
  on(target: string): IntentActions {
    const proxy = new IntentProxy(
      target,
      this.page,
      this.registry,
      this.observable,
    );
    this.proxies.push(proxy);
    return proxy;
  }

  /** Navigate to a URL directly */
  async navigate(url: string): Promise<IntentResult> {
    const proxy = new IntentProxy(
      url,
      this.page,
      this.registry,
      this.observable,
    );
    this.proxies.push(proxy);
    return proxy['dispatch']({ action: 'navigate', value: url });
  }

  /** Take a full-page screenshot */
  async screenshot(path?: string): Promise<IntentResult> {
    const proxy = new IntentProxy(
      'page',
      this.page,
      this.registry,
      this.observable,
    );
    this.proxies.push(proxy);
    return proxy['dispatch']({ action: 'screenshot', value: path });
  }

  /** Collect all IntentResults from this builder session */
  collectResults(): readonly IntentResult[] {
    return this.proxies.flatMap((p) => p.getResults());
  }

  /** Subscribe to intent events (for logging, reporting, etc.) */
  subscribe(
    handler: Parameters<AuraIntentObservable['subscribe']>[0],
  ): () => void {
    return this.observable.subscribe(handler);
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private static buildDefaultRegistry(): StrategyRegistry {
    const registry = new StrategyRegistry();
    registry.register('aria', ariaStrategy);
    registry.register('semantic', semanticStrategy);
    registry.register('heuristic', heuristicStrategy);
    return registry;
  }
}
