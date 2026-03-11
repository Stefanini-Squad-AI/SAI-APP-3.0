/**
 * AURA — LLM Adapter Factory
 * Crea el adaptador correcto según el proveedor configurado en .env.
 * Patrón: Factory + Strategy — cada proveedor implementa AIAdapter.
 *
 * El resto del framework solo habla con AIAdapter, sin saber qué LLM hay detrás.
 */
import type { AIAdapter, AIPrompt, AIResponse } from './OpenAIAdapter';
import {
  resolveActiveProvider,
  getActiveModelEntry,
  resolveModelName,
  resolveApiKey,
  type AIProviderName,
} from './AIModelConfig';

// ─── Re-export the shared contract ───────────────────────────────────────────
export type { AIAdapter, AIPrompt, AIResponse };

// ─── OpenAI Adapter ───────────────────────────────────────────────────────────

class OpenAIProviderAdapter implements AIAdapter {
  private client: InstanceType<typeof import('openai').default> | null = null;

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  private async getClient(): Promise<InstanceType<typeof import('openai').default>> {
    if (!this.client) {
      const { default: OpenAI } = await import('openai');
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
    return this.client;
  }

  async complete(prompt: AIPrompt): Promise<AIResponse> {
    const start = Date.now();
    const client = await this.getClient();

    const res = await client.chat.completions.create({
      model: this.model,
      temperature: prompt.temperature ?? 0.1,
      max_tokens: prompt.maxTokens ?? 512,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user',   content: prompt.user },
      ],
      response_format: { type: 'json_object' },
    });

    return {
      content: res.choices[0]?.message?.content ?? '{}',
      tokensUsed: res.usage?.total_tokens ?? 0,
      model: this.model,
      latencyMs: Date.now() - start,
    };
  }
}

// ─── Gemini Adapter (OpenAI-compatible endpoint via @google/generative-ai) ───

class GeminiProviderAdapter implements AIAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async complete(prompt: AIPrompt): Promise<AIResponse> {
    const start = Date.now();

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${prompt.system}\n\n${prompt.user}` }],
        },
      ],
      generationConfig: {
        temperature: prompt.temperature ?? 0.1,
        maxOutputTokens: prompt.maxTokens ?? 512,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`[AURA/Gemini] API error: ${response.status} ${response.statusText}`);
    }

    type GeminiResponse = {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
      usageMetadata?: { totalTokenCount?: number };
    };

    const data = await response.json() as GeminiResponse;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const tokensUsed = data.usageMetadata?.totalTokenCount ?? 0;

    return { content, tokensUsed, model: this.model, latencyMs: Date.now() - start };
  }
}

// ─── Perplexity Adapter (OpenAI-compatible API) ───────────────────────────────

class PerplexityProviderAdapter implements AIAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async complete(prompt: AIPrompt): Promise<AIResponse> {
    const start = Date.now();

    type PerplexityResponse = {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: prompt.maxTokens ?? 512,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user',   content: prompt.user },
      ],
    };

    // Reasoning models only accept temperature 0 < t < 2; skip if near zero
    const temp = prompt.temperature ?? 0.1;
    if (temp >= 0.01) {
      body.temperature = temp;
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let detail = '';
      try {
        const errBody = await response.text();
        detail = ` — ${errBody}`;
      } catch { /* ignore */ }
      throw new Error(
        `[AURA/Perplexity] API error: ${response.status} ${response.statusText}${detail}`,
      );
    }

    const data = await response.json() as PerplexityResponse;
    const content = data.choices?.[0]?.message?.content ?? '{}';
    const tokensUsed = data.usage?.total_tokens ?? 0;

    return { content, tokensUsed, model: this.model, latencyMs: Date.now() - start };
  }
}

// ─── Anthropic Adapter ────────────────────────────────────────────────────────

class AnthropicProviderAdapter implements AIAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async complete(prompt: AIPrompt): Promise<AIResponse> {
    const start = Date.now();

    type AnthropicResponse = {
      content?: Array<{ text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: prompt.maxTokens ?? 512,
        system: `${prompt.system}\nAlways respond with valid JSON only.`,
        messages: [{ role: 'user', content: prompt.user }],
        temperature: prompt.temperature ?? 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`[AURA/Anthropic] API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as AnthropicResponse;
    const content = data.content?.[0]?.text ?? '{}';
    const tokensUsed =
      (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);

    return { content, tokensUsed, model: this.model, latencyMs: Date.now() - start };
  }
}

// ─── Ollama Adapter (local) ───────────────────────────────────────────────────

class OllamaProviderAdapter implements AIAdapter {
  private readonly baseUrl: string;

  constructor(
    private readonly model: string,
    baseUrl?: string,
  ) {
    this.baseUrl = baseUrl ?? process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434';
  }

  async complete(prompt: AIPrompt): Promise<AIResponse> {
    const start = Date.now();

    type OllamaResponse = {
      message?: { content?: string };
      eval_count?: number;
      prompt_eval_count?: number;
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        format: 'json',
        options: { temperature: prompt.temperature ?? 0.1, num_predict: prompt.maxTokens ?? 512 },
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user',   content: prompt.user },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`[AURA/Ollama] API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as OllamaResponse;
    const content = data.message?.content ?? '{}';
    const tokensUsed = (data.eval_count ?? 0) + (data.prompt_eval_count ?? 0);

    return { content, tokensUsed, model: this.model, latencyMs: Date.now() - start };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Crea el adaptador LLM correcto basándose en la configuración del .env.
 * El resto del framework lo consume como AIAdapter sin conocer el proveedor.
 */
export function createLLMAdapter(providerOverride?: AIProviderName): AIAdapter {
  const provider = providerOverride ?? resolveActiveProvider();
  const entry    = getActiveModelEntry();
  const model    = resolveModelName(entry);
  const apiKey   = resolveApiKey(entry);

  switch (provider) {
    case 'openai':
      return new OpenAIProviderAdapter(apiKey!, model);

    case 'gemini':
      return new GeminiProviderAdapter(apiKey!, model);

    case 'perplexity':
      return new PerplexityProviderAdapter(apiKey!, model);

    case 'anthropic':
      return new AnthropicProviderAdapter(apiKey!, model);

    case 'ollama':
      return new OllamaProviderAdapter(model);

    default: {
      const _exhaustive: never = provider;
      throw new Error(`[AURA/AI] Unknown provider: ${String(_exhaustive)}`);
    }
  }
}

/** Crea un adaptador directamente para OpenAI (retro-compatibilidad) */
export function createOpenAIAdapter(apiKey: string, model?: string): AIAdapter {
  return new OpenAIProviderAdapter(apiKey, model ?? 'gpt-4o');
}
