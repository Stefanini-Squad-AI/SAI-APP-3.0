/**
 * AURA — Intent Layer Type Definitions
 * Defines the contracts for the Intent-driven API surface.
 */
import type { Page } from 'playwright';
import type {
  IntentAction,
  IntentPayload,
  IntentResult,
  Selector,
  SemanticResolution,
} from '../../types/index';

// ─── Resolver Contract ────────────────────────────────────────────────────────

export interface ElementResolver {
  resolve(target: string, page: Page): Promise<Selector>;
}

// ─── Executor Contract ────────────────────────────────────────────────────────

export interface ActionExecutor {
  execute(payload: IntentPayload, page: Page): Promise<IntentResult>;
}

// ─── Intent Fluent Builder ────────────────────────────────────────────────────

export interface IntentChain {
  on(target: string): IntentActions;
}

export interface IntentActions {
  click(options?: ClickOptions): Promise<IntentResult>;
  fill(value: string, options?: FillOptions): Promise<IntentResult>;
  select(value: string | string[]): Promise<IntentResult>;
  check(): Promise<IntentResult>;
  uncheck(): Promise<IntentResult>;
  hover(): Promise<IntentResult>;
  focus(): Promise<IntentResult>;
  clear(): Promise<IntentResult>;
  press(key: string): Promise<IntentResult>;
  waitFor(options?: WaitForOptions): Promise<IntentResult>;
  scroll(direction?: ScrollDirection): Promise<IntentResult>;
  screenshot(path?: string): Promise<IntentResult>;
  dragTo(targetSelector: string): Promise<IntentResult>;
  expect(): ExpectChain;
}

export interface ExpectChain {
  toBeVisible(): Promise<void>;
  toBeHidden(): Promise<void>;
  toBeEnabled(): Promise<void>;
  toBeDisabled(): Promise<void>;
  toHaveText(text: string): Promise<void>;
  toHaveValue(value: string): Promise<void>;
  toHaveCount(count: number): Promise<void>;
  toBeChecked(): Promise<void>;
}

// ─── Action Options ───────────────────────────────────────────────────────────

export interface ClickOptions {
  readonly button?: 'left' | 'right' | 'middle';
  readonly clickCount?: number;
  readonly delay?: number;
  readonly force?: boolean;
  readonly modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>;
  readonly timeout?: number;
}

export interface FillOptions {
  readonly force?: boolean;
  readonly timeout?: number;
}

export type ScrollDirection = 'up' | 'down' | 'left' | 'right';

export interface WaitForOptions {
  readonly state?: 'attached' | 'detached' | 'visible' | 'hidden';
  readonly timeout?: number;
}

// ─── Intent Factory ───────────────────────────────────────────────────────────

export interface IntentFactory {
  createChain(page: Page): IntentChain;
}

// ─── Resolution Strategy ──────────────────────────────────────────────────────

export type ResolutionStrategy = (
  target: string,
  page: Page,
) => Promise<SemanticResolution | null>;

export interface StrategyRegistry {
  register(name: string, strategy: ResolutionStrategy): void;
  resolve(target: string, page: Page): Promise<SemanticResolution>;
}

// ─── Intent Event ─────────────────────────────────────────────────────────────

export interface IntentEvent {
  readonly type: IntentAction | 'resolve' | 'error';
  readonly payload: IntentPayload;
  readonly result?: IntentResult;
  readonly timestamp: string;
}

export type IntentEventHandler = (event: IntentEvent) => void;

export interface IntentObservable {
  subscribe(handler: IntentEventHandler): () => void;
  emit(event: IntentEvent): void;
}
