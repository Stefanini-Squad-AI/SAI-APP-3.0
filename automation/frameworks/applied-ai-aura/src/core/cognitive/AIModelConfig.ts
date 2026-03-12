/**
 * AURA — AI Model Configuration
 * Extensible registry of LLM providers.
 * Users configure MODEL_PROVIDER in .env and the framework selects
 * the correct adapter automatically.
 *
 * Supported providers:
 *   openai | gemini | perplexity | anthropic | ollama
 */

// ─── Provider Enum ────────────────────────────────────────────────────────────

export type AIProviderName =
  | 'openai'
  | 'gemini'
  | 'perplexity'
  | 'anthropic'
  | 'ollama';

// ─── Model Registry Entry ─────────────────────────────────────────────────────

export interface AIModelEntry {
  readonly provider: AIProviderName;
  /** Environment variable names that can hold the API key (checked in order) */
  readonly apiKeyEnvVars: readonly string[];
  /** Default model identifier */
  readonly defaultModel: string;
  /** All supported model identifiers for validation */
  readonly availableModels: readonly string[];
  /** Whether this provider requires an API key (false = local/Ollama) */
  readonly requiresApiKey: boolean;
  /** Base URL for non-standard endpoints (e.g. Ollama local) */
  readonly defaultBaseUrl?: string;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const AI_MODEL_REGISTRY: Readonly<Record<AIProviderName, AIModelEntry>> = {
  openai: {
    provider: 'openai',
    apiKeyEnvVars: ['OPENAI_API_KEY'],
    defaultModel: 'gpt-4o',
    availableModels: [
      'gpt-4o', 'gpt-4o-mini',
      'gpt-4-turbo', 'gpt-4',
      'gpt-3.5-turbo',
      'o1', 'o1-mini', 'o3-mini',
    ],
    requiresApiKey: true,
  },

  gemini: {
    provider: 'gemini',
    apiKeyEnvVars: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    defaultModel: 'gemini-2.0-flash',
    availableModels: [
      'gemini-2.0-flash', 'gemini-2.0-flash-lite',
      'gemini-1.5-pro', 'gemini-1.5-flash',
      'gemini-1.0-pro',
    ],
    requiresApiKey: true,
  },

  perplexity: {
    provider: 'perplexity',
    apiKeyEnvVars: ['PERPLEXITY_API_KEY'],
    defaultModel: 'sonar-reasoning',
    availableModels: [
      'sonar-reasoning', 'sonar-reasoning-pro',
      'sonar-pro', 'sonar',
      'sonar-deep-research',
    ],
    requiresApiKey: true,
    defaultBaseUrl: 'https://api.perplexity.ai',
  },

  anthropic: {
    provider: 'anthropic',
    apiKeyEnvVars: ['ANTHROPIC_API_KEY'],
    defaultModel: 'claude-3-5-sonnet-20241022',
    availableModels: [
      'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229', 'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    requiresApiKey: true,
  },

  ollama: {
    provider: 'ollama',
    apiKeyEnvVars: [],
    defaultModel: 'llama3',
    availableModels: ['llama3', 'llama3.1', 'mistral', 'mixtral', 'phi3', 'gemma2'],
    requiresApiKey: false,
    defaultBaseUrl: 'http://localhost:11434',
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Detects the active provider from environment variables.
 * Priority: MODEL_PROVIDER > auto-detect by available API keys > openai fallback
 */
export function resolveActiveProvider(): AIProviderName {
  const explicit = process.env['MODEL_PROVIDER']?.toLowerCase().trim() as AIProviderName | undefined;

  if (explicit && explicit in AI_MODEL_REGISTRY) {
    return explicit;
  }
  if (explicit) {
    console.warn(
      `[AURA/AI] MODEL_PROVIDER="${explicit}" not recognized. ` +
      `Valid: ${Object.keys(AI_MODEL_REGISTRY).join(', ')}. Auto-detecting...`,
    );
  }

  // Auto-detect from available API keys
  if (process.env['OPENAI_API_KEY']) return 'openai';
  if (process.env['GEMINI_API_KEY'] || process.env['GOOGLE_API_KEY']) return 'gemini';
  if (process.env['ANTHROPIC_API_KEY']) return 'anthropic';
  if (process.env['PERPLEXITY_API_KEY']) return 'perplexity';
  if (process.env['OLLAMA_BASE_URL']) return 'ollama';

  return 'openai'; // default
}

/** Returns the active provider configuration. */
export function getActiveModelEntry(): AIModelEntry {
  return AI_MODEL_REGISTRY[resolveActiveProvider()];
}

/** Returns model name, honoring env override when valid. */
export function resolveModelName(entry: AIModelEntry): string {
  const envVarName = `${entry.provider.toUpperCase()}_MODEL`;
  const override = process.env[envVarName]?.trim();

  if (override) {
    if (entry.availableModels.includes(override)) return override;
    console.warn(
      `[AURA/AI] Model "${override}" not in available list for ${entry.provider}. ` +
      `Using default: ${entry.defaultModel}`,
    );
  }
  return entry.defaultModel;
}

/** Resolves the API key for a provider. */
export function resolveApiKey(entry: AIModelEntry): string | undefined {
  for (const envVar of entry.apiKeyEnvVars) {
    const key = process.env[envVar]?.trim();
    if (key && !key.startsWith('your_')) return key;
  }
  return undefined;
}

/** Validates active provider configuration. */
export function validateActiveProvider(): void {
  const provider = resolveActiveProvider();
  const entry = AI_MODEL_REGISTRY[provider];

  if (entry.requiresApiKey && !resolveApiKey(entry)) {
    const vars = entry.apiKeyEnvVars.join(' or ');
    throw new Error(
      `[AURA/AI] API key required for provider "${provider}".\n` +
      `Set one of these env vars: ${vars}\n` +
      `Or set MODEL_PROVIDER to a different provider.`,
    );
  }

  console.info(
    `[AURA/AI] Active provider: ${provider} · Model: ${resolveModelName(entry)}`,
  );
}
