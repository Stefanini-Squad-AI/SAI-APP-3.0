/**
 * AURA — Cognitive Scanner
 * Proprietary semantic inference engine.
 * Supports multiple LLM providers configured via .env.
 *
 * Architecture:
 *   DOMExtractor      → compact DOM snapshot
 *   LLMAdapterFactory → selects active LLM provider (openai/gemini/perplexity/anthropic/ollama)
 *   SemanticCache     → avoids redundant API calls
 */
import type { Page } from 'playwright';
import { createLLMAdapter } from './LLMAdapterFactory';
import type { AIAdapter } from './LLMAdapterFactory';
import { SemanticCache } from './SemanticCache';
import { DOMExtractor } from './DOMExtractor';
import {
  resolveActiveProvider,
  resolveApiKey,
  getActiveModelEntry,
  resolveModelName,
} from './AIModelConfig';
import type { ResolutionStrategy } from '../intent/types';
import type { SemanticResolution, Selector } from '../../types/index';

// ─── AI Response Shape ────────────────────────────────────────────────────────

interface AISelectorResponse {
  selector: string;
  confidence: number;
  explanation: string;
  alternatives?: string[];
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are AURA's Cognitive Scanner — an expert in web accessibility and DOM analysis.
Your job is to map a natural-language intent to the BEST CSS/ARIA/Playwright selector
from a compact DOM snapshot.

Rules:
1. Prefer data-testid, aria-label, role+name over fragile CSS paths.
2. Return valid Playwright locator syntax (e.g., "[data-testid='x']", "text=Submit", "[aria-label='Foo']").
3. Only return selectors for elements present in the provided DOM.
4. Confidence: 0.0 (no match) to 1.0 (exact, unambiguous match).
5. Always respond with valid JSON matching this schema:
   { "selector": string, "confidence": number, "explanation": string, "alternatives": string[] }
6. NEVER translate any text, label, or string — copy them EXACTLY as they appear in the DOM.
7. NEVER use HTML tag names (a, div, span…) as ARIA role values. Valid ARIA roles are: link, button, textbox, checkbox, radio, combobox, listbox, option, menuitem, tab, heading, img, etc.
8. When the target is a link/anchor, prefer selectors like "text=Label", "[aria-label='Label']", or "role=link[name='Label']" over raw CSS attribute selectors.
`.trim();

// ─── Cognitive Scanner ────────────────────────────────────────────────────────

export class CognitiveScanner {
  private readonly extractor = new DOMExtractor();
  private readonly cache: SemanticCache;
  private readonly adapter: AIAdapter | null;

  constructor(
    _cacheEnabledInit = true,
    cacheTtl = 3600,
  ) {
    this.cache = new SemanticCache(cacheTtl);
    this.adapter = this.buildAdapter();
  }

  private buildAdapter(): AIAdapter | null {
    const entry = getActiveModelEntry();
    const apiKey = resolveApiKey(entry);

    if (entry.requiresApiKey && !apiKey) {
      console.warn(
        `[AURA/Cognitive] No API key found for provider "${entry.provider}". ` +
        `AI resolution disabled. Set ${entry.apiKeyEnvVars.join(' or ')} in .env`,
      );
      return null;
    }

    try {
      const provider = resolveActiveProvider();
      const model = resolveModelName(entry);
      console.info(`[AURA/Cognitive] LLM provider: ${provider} · model: ${model}`);
      return createLLMAdapter(provider);
    } catch (err) {
      console.warn('[AURA/Cognitive] Failed to initialize LLM adapter:', err);
      return null;
    }
  }

  /**
   * Returns a ResolutionStrategy pluggable into the StrategyRegistry.
   */
  toStrategy(): ResolutionStrategy {
    return async (target: string, page: Page): Promise<SemanticResolution | null> => {
      return this.resolve(target, page);
    };
  }

  async resolve(intent: string, page: Page): Promise<SemanticResolution | null> {
    if (!this.adapter) return null;

    const url = page.url();
    const cacheKey = SemanticCache.buildKey(intent, url);
    const cacheEnabled = process.env['AURA_COGNITIVE_CACHE'] !== 'false';

    if (cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.info(`[AURA/Cognitive] Cache hit for: "${intent}"`);
        return cached;
      }
    }

    const snapshot = await this.extractor.extract(page);
    const domText  = DOMExtractor.format(snapshot);

    const userPrompt = `
Intent: "${intent}"

Current page DOM:
${domText}

Find the best selector for the element described by the intent.
`.trim();

    let rawContent: string;
    try {
      const response = await this.adapter.complete({
        system: SYSTEM_PROMPT,
        user: userPrompt,
        temperature: 0.05,
        maxTokens: 256,
      });
      rawContent = response.content;
    } catch (err) {
      console.warn('[AURA/Cognitive] LLM call failed:', err);
      return null;
    }

    let parsed: AISelectorResponse;
    try {
      parsed = JSON.parse(rawContent) as AISelectorResponse;
    } catch {
      console.warn('[AURA/Cognitive] Could not parse LLM response as JSON.');
      return null;
    }

    if (!parsed.selector || parsed.confidence < 0.3) return null;

    // Validate: the AI-generated selector must actually match an element on the page.
    // This catches invalid selectors (e.g. [role="a"]) and translated labels.
    try {
      const matchCount = await page.locator(parsed.selector).count();
      if (matchCount === 0) {
        console.warn(
          `[AURA/Cognitive] Selector "${parsed.selector}" matches 0 elements — discarding AI result.`,
        );
        return null;
      }
    } catch {
      console.warn(
        `[AURA/Cognitive] Selector "${parsed.selector}" is syntactically invalid — discarding AI result.`,
      );
      return null;
    }

    const resolution: SemanticResolution = {
      selector: parsed.selector as Selector,
      confidence: parsed.confidence,
      strategy: 'ai',
      explanation: `[${resolveActiveProvider()}] ${parsed.explanation ?? ''}`,
    };

    if (cacheEnabled) {
      this.cache.set(cacheKey, resolution);
    }

    return resolution;
  }
}

// Named export for backwards compatibility
export { validateActiveProvider } from './AIModelConfig';
