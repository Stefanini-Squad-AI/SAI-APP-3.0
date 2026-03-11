/**
 * AURA — OpenAI Adapter
 * Thin, strictly-typed wrapper around the OpenAI SDK.
 * Isolates all AI communication behind a single contract so the rest of
 * the framework stays decoupled from the provider.
 */
import OpenAI from 'openai';

export interface AIPrompt {
  readonly system: string;
  readonly user: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
}

export interface AIResponse {
  readonly content: string;
  readonly tokensUsed: number;
  readonly model: string;
  readonly latencyMs: number;
}

export interface AIAdapter {
  complete(prompt: AIPrompt): Promise<AIResponse>;
}

export class OpenAIAdapter implements AIAdapter {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model = 'gpt-4o') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async complete(prompt: AIPrompt): Promise<AIResponse> {
    const start = Date.now();

    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: prompt.temperature ?? 0.1,
      max_tokens: prompt.maxTokens ?? 512,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const tokensUsed = response.usage?.total_tokens ?? 0;

    return {
      content,
      tokensUsed,
      model: this.model,
      latencyMs: Date.now() - start,
    };
  }
}
