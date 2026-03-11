/**
 * AURA — Action Executor
 * Maps IntentPayload objects to concrete Playwright calls.
 * Uses the Command pattern: each action is a self-contained command.
 */
import type { Page } from 'playwright';
import { expect } from '@playwright/test';
import type { ActionExecutor } from './types';
import type { IntentPayload, IntentResult, Selector } from '../../types/index';

type ActionHandler = (
  page: Page,
  selector: Selector,
  payload: IntentPayload,
) => Promise<void>;

const actionMap: Readonly<Record<string, ActionHandler>> = {
  click: async (page, selector, payload) => {
    const opts = payload.options as Parameters<Page['click']>[1] | undefined;
    await page.locator(selector).click(opts);
  },

  fill: async (page, selector, payload) => {
    const value = typeof payload.value === 'string' ? payload.value : '';
    await page.locator(selector).fill(value);
  },

  select: async (page, selector, payload) => {
    const values = Array.isArray(payload.value)
      ? payload.value
      : [payload.value ?? ''];
    await page.locator(selector).selectOption(values);
  },

  check: async (page, selector) => {
    await page.locator(selector).check();
  },

  uncheck: async (page, selector) => {
    await page.locator(selector).uncheck();
  },

  hover: async (page, selector) => {
    await page.locator(selector).hover();
  },

  focus: async (page, selector) => {
    await page.locator(selector).focus();
  },

  clear: async (page, selector) => {
    await page.locator(selector).clear();
  },

  press: async (page, selector, payload) => {
    const key = typeof payload.value === 'string' ? payload.value : 'Enter';
    await page.locator(selector).press(key);
  },

  waitFor: async (page, selector, payload) => {
    const opts = payload.options as Parameters<ReturnType<Page['locator']>['waitFor']>[0];
    await page.locator(selector).waitFor(opts);
  },

  navigate: async (page, _selector, payload) => {
    const url = typeof payload.value === 'string' ? payload.value : payload.target;
    await page.goto(url);
  },

  screenshot: async (page, _selector, payload) => {
    const path = typeof payload.value === 'string' ? payload.value : undefined;
    await page.screenshot({ path, fullPage: true });
  },

  scroll: async (page, selector) => {
    await page.locator(selector).scrollIntoViewIfNeeded();
  },

  dragTo: async (page, selector, payload) => {
    const targetSelector = typeof payload.value === 'string' ? payload.value : '';
    await page.locator(selector).dragTo(page.locator(targetSelector));
  },
};

// ─── Expect Action Map ────────────────────────────────────────────────────────

type ExpectHandler = (
  page: Page,
  selector: Selector,
  value?: string | number,
) => Promise<void>;

export const expectMap: Readonly<Record<string, ExpectHandler>> = {
  toBeVisible: async (page, selector) => {
    await expect(page.locator(selector)).toBeVisible();
  },
  toBeHidden: async (page, selector) => {
    await expect(page.locator(selector)).toBeHidden();
  },
  toBeEnabled: async (page, selector) => {
    await expect(page.locator(selector)).toBeEnabled();
  },
  toBeDisabled: async (page, selector) => {
    await expect(page.locator(selector)).toBeDisabled();
  },
  toHaveText: async (page, selector, value) => {
    await expect(page.locator(selector)).toHaveText(String(value));
  },
  toHaveValue: async (page, selector, value) => {
    await expect(page.locator(selector)).toHaveValue(String(value));
  },
  toHaveCount: async (page, selector, value) => {
    await expect(page.locator(selector)).toHaveCount(Number(value));
  },
  toBeChecked: async (page, selector) => {
    await expect(page.locator(selector)).toBeChecked();
  },
};

// ─── Executor Implementation ──────────────────────────────────────────────────

export class AuraActionExecutor implements ActionExecutor {
  async execute(payload: IntentPayload, page: Page): Promise<IntentResult> {
    const start = Date.now();
    const handler = actionMap[payload.action];

    if (!handler) {
      console.error(`[AURA/Executor] ✗ Unsupported action: "${payload.action}"`);
      return {
        action: payload.action,
        target: payload.target,
        success: false,
        durationMs: 0,
        timestamp: new Date().toISOString(),
        error: `Unsupported action: "${payload.action}"`,
      };
    }

    console.info(`[AURA/Executor] ▷ Executing: ${payload.action} → selector: "${payload.target}"`);

    try {
      await handler(page, payload.target as Selector, payload);
      const duration = Date.now() - start;
      console.info(`[AURA/Executor] ✓ ${payload.action} completed in ${duration}ms`);
      return {
        action: payload.action,
        target: payload.target,
        success: true,
        resolvedSelector: payload.target as Selector,
        durationMs: duration,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      const duration = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[AURA/Executor] ✗ ${payload.action} FAILED after ${duration}ms: ${errorMsg}`);
      return {
        action: payload.action,
        target: payload.target,
        success: false,
        resolvedSelector: payload.target as Selector,
        durationMs: duration,
        timestamp: new Date().toISOString(),
        error: errorMsg,
      };
    }
  }
}
