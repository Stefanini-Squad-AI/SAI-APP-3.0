/**
 * AURA — Cucumber World
 * Contexto compartido inyectado en cada step definition.
 *
 * Expone:
 *   this.webActions  — Motor de interacciones web (fluent, limpio)
 *   this.I           — Intent builder (resolución semántica avanzada)
 *   this.page        — Página Playwright raw (escape hatch)
 *   this.factory     — BrowserFactory (ciclo de vida del navegador)
 */
// dotenv v17+ auto-loads .env before execution — no manual call needed for cucumber-js.
// Manual load kept only as safety net for ts-node direct execution.
import 'dotenv/config';

import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import type { Page } from 'playwright';
import { IntentBuilder } from '../../core/intent/IntentBuilder';
import { StrategyRegistry, ariaStrategy, semanticStrategy, heuristicStrategy } from '../../core/intent/StrategyRegistry';
import { AuraIntentObservable } from '../../core/intent/IntentObservable';
import { CognitiveScanner } from '../../core/cognitive/CognitiveScanner';
import { BrowserFactory } from '../../core/engine/BrowserFactory';
import { WebActions } from '../../core/engine/WebActions';
import { AuraReportCollector } from '../../core/reporting/AuraReportCollector';
import type { IntentResult } from '../../types/index';

export interface AuraWorldInterface {
  page:       Page;
  I:          IntentBuilder;
  webActions: WebActions;
  factory:    BrowserFactory;
  report:     AuraReportCollector;
  collectIntentResults(): readonly IntentResult[];
}

export class AuraWorld extends World implements AuraWorldInterface {
  page!:       Page;
  I!:          IntentBuilder;
  webActions!: WebActions;
  factory!:    BrowserFactory;
  report!:     AuraReportCollector;

  private readonly observable = new AuraIntentObservable();

  constructor(options: IWorldOptions) {
    super(options);
  }

  async init(scenarioName: string, featureName: string, tags: string[]): Promise<void> {
    this.report     = new AuraReportCollector('reports');
    this.report.startScenario(scenarioName, featureName, tags);

    this.factory    = BrowserFactory.fromEnv();
    this.factory.setVideoDir(this.report.getReportDir() + '/videos');
    this.page       = await this.factory.createPage();
    this.I          = IntentBuilder.withRegistry(this.page, this.buildRegistry(), this.observable);
    this.webActions = new WebActions(this.page, this.I);
    this.webActions.setBeforeClickHook(async (page) => {
      await this.report.capturePreActionScreenshot(page);
    });
  }

  async teardown(): Promise<void> {
    await this.factory.teardown();
  }

  collectIntentResults(): readonly IntentResult[] {
    return this.I.collectResults();
  }

  // ─── Strategy Pipeline ─────────────────────────────────────────────────────

  private buildRegistry(): StrategyRegistry {
    const registry = new StrategyRegistry();

    registry.register('aria',      ariaStrategy);
    registry.register('semantic',  semanticStrategy);
    registry.register('heuristic', heuristicStrategy);

    const cognitiveEnabled = process.env['AURA_COGNITIVE_ENABLED'] !== 'false';
    if (cognitiveEnabled) {
      const scanner = new CognitiveScanner(
        process.env['AURA_COGNITIVE_CACHE'] !== 'false',
        Number(process.env['AURA_COGNITIVE_CACHE_TTL'] ?? '3600'),
      );
      registry.register('ai', scanner.toStrategy());
    }

    return registry;
  }
}

setWorldConstructor(AuraWorld);
