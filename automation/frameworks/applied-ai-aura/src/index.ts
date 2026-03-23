/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                                                                  ║
 * ║   ⚡ AURA — Autonomous Understanding & Reasoning Automator       ║
 * ║   Next-Generation Test Automation Framework                      ║
 * ║   Built on Playwright · TypeScript · Cucumber · OpenAI           ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Public API surface of the AURA framework.
 * Import from this file to access all framework capabilities.
 *
 * @example
 * ```typescript
 * import { IntentBuilder, AuraChange, ReportEngine } from '@stefanini/aura-framework';
 * ```
 */

// ── Intent-Driven API (Core) ─────────────────────────────────────────────────
export { IntentBuilder } from './core/intent/IntentBuilder';
export { IntentProxy } from './core/intent/IntentProxy';
export { StrategyRegistry } from './core/intent/StrategyRegistry';
export { AuraIntentObservable } from './core/intent/IntentObservable';
export type {
  IntentChain,
  IntentActions,
  ExpectChain,
  ClickOptions,
  FillOptions,
  WaitForOptions,
  ScrollDirection,
  ElementResolver,
  ActionExecutor,
  IntentFactory,
  ResolutionStrategy,
  StrategyRegistry as IStrategyRegistry,
  IntentEvent,
  IntentEventHandler,
  IntentObservable,
} from './core/intent/types';

// ── Cognitive Scanner (AI Engine) ────────────────────────────────────────────
export { CognitiveScanner } from './core/cognitive/CognitiveScanner';
export { OpenAIAdapter } from './core/cognitive/OpenAIAdapter';
export { SemanticCache } from './core/cognitive/SemanticCache';
export { DOMExtractor } from './core/cognitive/DOMExtractor';
export type { AIAdapter, AIPrompt, AIResponse } from './core/cognitive/OpenAIAdapter';
export type { DOMElement, DOMSnapshot } from './core/cognitive/DOMExtractor';

// ── Self-Documenting ChangeLog ───────────────────────────────────────────────
export { ChangelogRegistry } from './core/changelog/ChangelogRegistry';
export {
  AuraChange,
  AuraFeature,
  AuraFix,
  AuraRefactor,
  AuraBreaking,
  AuraDocs,
  AuraPerf,
  getChangeMetadata,
} from './core/changelog/decorators';
export type { ChangeDecoratorOptions } from './core/changelog/decorators';
export type { ChangelogFilter } from './core/changelog/ChangelogRegistry';

// ── Reporting Engine ─────────────────────────────────────────────────────────
export { ReportEngine } from './core/reporting/ReportEngine';
export { HTMLDashboard } from './core/reporting/HTMLDashboard';

// ── Browser Factory ───────────────────────────────────────────────────────────
export { BrowserFactory } from './core/engine/BrowserFactory';

// ── Global Types ──────────────────────────────────────────────────────────────
export type {
  AuraConfig,
  AuraBrowserConfig,
  BrowserName,
  IntentAction,
  IntentPayload,
  IntentResult,
  SemanticContext,
  SemanticResolution,
  CognitiveCache,
  ChangeEntry,
  ChangeKind,
  TestStatus,
  StepResult,
  ScenarioResult,
  ReportSummary,
  FeatureSuiteStat,
  Selector,
  IntentText,
  StepId,
  ChangeId,
} from './types/index';
