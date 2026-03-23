/**
 * AURA Framework — Global Type Definitions
 * All shared interfaces, enums and branded types live here.
 */

// ─── Branded Primitives ───────────────────────────────────────────────────────

declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type Selector   = Brand<string, 'Selector'>;
export type IntentText = Brand<string, 'IntentText'>;
export type StepId     = Brand<string, 'StepId'>;
export type ChangeId   = Brand<string, 'ChangeId'>;

// ─── Browser / Engine ────────────────────────────────────────────────────────

export type BrowserName = 'chromium' | 'firefox' | 'webkit';

export interface AuraBrowserConfig {
  readonly browser: BrowserName;
  readonly headless: boolean;
  readonly slowMo: number;
  readonly timeout: number;
  readonly viewport?: Readonly<{ width: number; height: number }>;
}

// ─── Intent System ───────────────────────────────────────────────────────────

export type IntentAction =
  | 'click'
  | 'fill'
  | 'select'
  | 'check'
  | 'uncheck'
  | 'hover'
  | 'focus'
  | 'clear'
  | 'press'
  | 'upload'
  | 'waitFor'
  | 'navigate'
  | 'screenshot'
  | 'scroll'
  | 'dragTo';

export interface IntentPayload {
  readonly action: IntentAction;
  readonly target: string;
  readonly value?: string | string[];
  readonly options?: Readonly<Record<string, unknown>>;
}

export interface IntentResult {
  readonly action: IntentAction;
  readonly target: string;
  readonly success: boolean;
  readonly resolvedSelector?: Selector;
  readonly durationMs: number;
  readonly timestamp: string;
  readonly error?: string;
}

// ─── Cognitive Scanner ───────────────────────────────────────────────────────

export interface SemanticContext {
  readonly pageTitle: string;
  readonly url: string;
  readonly domSnapshot: string;
  readonly intent: string;
}

export interface SemanticResolution {
  readonly selector: Selector;
  readonly confidence: number;
  readonly strategy: 'aria' | 'semantic' | 'heuristic' | 'ai';
  readonly explanation: string;
}

export interface CognitiveCache {
  readonly key: string;
  readonly resolution: SemanticResolution;
  readonly createdAt: string;
  readonly ttl: number;
}

// ─── ChangeLog / Decorators ──────────────────────────────────────────────────

export type ChangeKind = 'feature' | 'fix' | 'refactor' | 'breaking' | 'docs' | 'perf';

export interface ChangeEntry {
  readonly id: ChangeId;
  readonly kind: ChangeKind;
  readonly title: string;
  readonly description: string;
  readonly author: string;
  readonly version: string;
  readonly date: string;
  readonly tags: readonly string[];
  readonly target: string;
}

// ─── Reporting ───────────────────────────────────────────────────────────────

export type TestStatus = 'passed' | 'failed' | 'skipped' | 'pending';

export interface StepResult {
  readonly id: StepId;
  readonly text: string;
  readonly status: TestStatus;
  readonly durationMs: number;
  readonly error?: string;
  readonly screenshot?: string;
  readonly intents: readonly IntentResult[];
}

export interface ScenarioResult {
  readonly id: string;
  readonly name: string;
  readonly featureName: string;
  readonly tags: readonly string[];
  readonly status: TestStatus;
  readonly durationMs: number;
  readonly steps: readonly StepResult[];
  readonly startedAt: string;
  readonly finishedAt: string;
}

/** Un “test” en AURA = un Feature Gherkin; contiene uno o más escenarios. */
export interface FeatureSuiteStat {
  readonly featureName: string;
  readonly scenarioCount: number;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly pending: number;
}

export interface ReportSummary {
  readonly title: string;
  readonly generatedAt: string;
  /** Número de features (tests) incluidos en esta ejecución. */
  readonly totalFeatures: number;
  readonly totalScenarios: number;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly pending: number;
  readonly durationMs: number;
  readonly passRate: number;
  readonly scenarios: readonly ScenarioResult[];
  /** Desglose por feature: escenarios y resultado por “test”. */
  readonly featureStats: readonly FeatureSuiteStat[];
  readonly changelog: readonly ChangeEntry[];
}

// ─── Framework Config ────────────────────────────────────────────────────────

export interface AuraConfig {
  readonly browser: AuraBrowserConfig;
  readonly cognitive: {
    readonly enabled: boolean;
    readonly cache: boolean;
    readonly cacheTtl: number;
    readonly openAiModel: string;
  };
  readonly reporting: {
    readonly title: string;
    readonly theme: 'dark' | 'grey';
    readonly outputDir: string;
  };
}
