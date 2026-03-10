/**
 * Configuración de modelos de IA disponibles
 * Estructura extensible para agregar nuevos modelos en el futuro
 */
export enum AIModelProvider {
  GEMINI = "gemini",
  PERPLEXITY = "perplexity",
  OLLAMA = "ollama",
}

export interface ModelConfig {
  provider: AIModelProvider;
  apiKeyEnv: string[];
  modelName: string;
  defaultModelName: string;
  availableModels: string[];
  env: "LOCAL" | "BROWSERBASE";
  requiresApiKey: boolean;
}

/**
 * Configuración de modelos disponibles
 * Para agregar un nuevo modelo, simplemente añádelo aquí
 */
export const MODEL_CONFIGS: Record<AIModelProvider, ModelConfig> = {
  [AIModelProvider.GEMINI]: {
    provider: AIModelProvider.GEMINI,
    apiKeyEnv: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    defaultModelName: "google/gemini-2.0-flash",
    modelName: "google/gemini-2.0-flash",
    availableModels: ["google/gemini-2.0-flash"],
    env: "LOCAL",
    requiresApiKey: true,
  },
  [AIModelProvider.PERPLEXITY]: {
    provider: AIModelProvider.PERPLEXITY,
    apiKeyEnv: ["PERPLEXITY_API_KEY"],
    defaultModelName: "perplexity/sonar-reasoning",
    modelName: "perplexity/sonar-reasoning", // Se puede sobrescribir con PERPLEXITY_MODEL
    availableModels: [
      "perplexity/sonar-reasoning",
      "perplexity/sonar-reasoning-pro",
      "perplexity/sonar-pro",
      "perplexity/sonar",
      "perplexity/sonar-deep-research",
    ],
    env: "LOCAL",
    requiresApiKey: true,
  },
  [AIModelProvider.OLLAMA]: {
    provider: AIModelProvider.OLLAMA,
    apiKeyEnv: ["OLLAMA_API_KEY"],
    defaultModelName: "ollama/llama3",
    modelName: "ollama/llama3",
    availableModels: ["ollama/llama3"],
    env: "LOCAL",
    requiresApiKey: false,
  },
};

/**
 * Obtiene la configuración del modelo según el proveedor seleccionado
 */
export function getModelConfig(provider: AIModelProvider): ModelConfig {
  const config = MODEL_CONFIGS[provider];
  if (!config) {
    throw new Error(`Modelo "${provider}" no está configurado. Modelos disponibles: ${Object.keys(MODEL_CONFIGS).join(", ")}`);
  }
  
  // Permite sobrescribir el modelo específico desde variables de entorno
  const modelEnvVar = `${provider.toUpperCase()}_MODEL`;
  const customModel = process.env[modelEnvVar]?.trim();
  
  if (customModel) {
    // Validar que el modelo personalizado esté en la lista de disponibles
    if (config.availableModels.includes(customModel)) {
      return {
        ...config,
        modelName: customModel,
      };
    } else {
      console.warn(
        `⚠️  Modelo "${customModel}" no está en la lista de modelos disponibles para ${provider}.\n` +
        `Modelos disponibles: ${config.availableModels.join(", ")}\n` +
        `Usando modelo por defecto: ${config.defaultModelName}`
      );
    }
  }
  
  return config;
}

/**
 * Obtiene el proveedor de modelo desde las variables de entorno
 * Prioridad: MODEL_PROVIDER > GEMINI_API_KEY > PERPLEXITY_API_KEY > OLLAMA_API_KEY
 */
export function getSelectedProvider(): AIModelProvider {
  const modelProvider = process.env.MODEL_PROVIDER?.toLowerCase().trim();
  
  if (modelProvider) {
    const provider = Object.values(AIModelProvider).find(
      p => p.toLowerCase() === modelProvider
    );
    if (provider) {
      return provider;
    }
    console.warn(`⚠️  MODEL_PROVIDER "${modelProvider}" no es válido. Usando detección automática.`);
  }
  
  // Detección automática basada en las API keys disponibles
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    return AIModelProvider.GEMINI;
  }
  if (process.env.PERPLEXITY_API_KEY) {
    return AIModelProvider.PERPLEXITY;
  }
  if (process.env.OLLAMA_API_KEY || process.env.OLLAMA_BASE_URL) {
    return AIModelProvider.OLLAMA;
  }
  
  // Por defecto, usar Gemini
  return AIModelProvider.GEMINI;
}

/**
 * Obtiene la API key para un proveedor específico
 */
export function getApiKeyForProvider(provider: AIModelProvider): string | undefined {
  const config = getModelConfig(provider);
  
  for (const envVar of config.apiKeyEnv) {
    const apiKey = process.env[envVar]?.trim();
    if (apiKey && apiKey !== `your_${envVar.toLowerCase()}_here`) {
      return apiKey;
    }
  }
  
  return undefined;
}

/**
 * Valida que la configuración del modelo sea correcta
 */
export function validateModelConfig(provider: AIModelProvider): void {
  const config = getModelConfig(provider);
  
  if (config.requiresApiKey) {
    const apiKey = getApiKeyForProvider(provider);
    if (!apiKey) {
      const envVars = config.apiKeyEnv.join(" o ");
      throw new Error(
        `❌ API KEY requerida para ${provider.toUpperCase()}\n\n` +
        `Por favor configura una de estas variables de entorno:\n` +
        `- ${envVars}\n\n` +
        `O configura MODEL_PROVIDER=${provider} en tu archivo .env`
      );
    }
  }
}

