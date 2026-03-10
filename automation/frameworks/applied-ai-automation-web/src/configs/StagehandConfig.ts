import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { Stagehand } from "@browserbasehq/stagehand";
import { 
  AIModelProvider, 
  getSelectedProvider, 
  getModelConfig, 
  getApiKeyForProvider,
  validateModelConfig 
} from "./AIModelConfig";

/**
 * Configuración centralizada de Stagehand
 * Abstrae completamente la implementación del framework
 * Soporta múltiples proveedores de IA: Gemini, Perplexity, Ollama
 */
export class StagehandConfig {
  private static instance: StagehandConfig;
  private stagehand: Stagehand | null = null;
  private currentProvider: AIModelProvider;
  private videoDir?: string;

  private constructor() {
    // Constructor privado para implementar patrón Singleton
    this.currentProvider = getSelectedProvider();
  }

  /**
   * Establece el directorio donde se guardará el video
   * Debe llamarse ANTES de initialize() para que funcione
   */
  public setVideoDirectory(videoDir: string): void {
    this.videoDir = videoDir;
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }
  }

  /**
   * Obtiene la instancia única de StagehandConfig (Singleton)
   */
  public static getInstance(): StagehandConfig {
    if (!StagehandConfig.instance) {
      StagehandConfig.instance = new StagehandConfig();
    }
    return StagehandConfig.instance;
  }

  /**
   * Obtiene el proveedor de modelo actualmente configurado
   */
  public getCurrentProvider(): AIModelProvider {
    return this.currentProvider;
  }

  /**
   * Inicializa la configuración de Stagehand con el modelo seleccionado
   */
  public async initialize(): Promise<void> {
    if (this.stagehand) {
      return;
    }

    // Validar configuración del modelo
    validateModelConfig(this.currentProvider);
    
    const config = getModelConfig(this.currentProvider);
    const apiKey = config.requiresApiKey ? getApiKeyForProvider(this.currentProvider) : undefined;

    if (config.requiresApiKey && (!apiKey || apiKey === "")) {
      const envVars = config.apiKeyEnv.join(" o ");
      throw new Error(
        `❌ API KEY no está configurada para ${this.currentProvider.toUpperCase()}.\n` +
        `Por favor:\n` +
        `1. Crea un archivo .env en la raíz del proyecto\n` +
        `2. Agrega una de estas opciones:\n` +
        `   - ${envVars}=tu_api_key_aqui\n` +
        `   - MODEL_PROVIDER=${this.currentProvider}\n` +
        `3. Obtén tu API key según el proveedor:\n` +
        this.getApiKeyInstructions(this.currentProvider)
      );
    }

    // Permitir sobrescribir el entorno desde .env
    const env = (process.env.ENV || config.env).toUpperCase() as "LOCAL" | "BROWSERBASE";

    // En modo LOCAL se puede activar headless via HEADLESS=true (requerido para CI/CD)
    const isHeadless = process.env.HEADLESS === 'true';

    const stagehandConfig: any = {
      env: env,
      model: config.modelName,
      headless: isHeadless,
    };

    if (isHeadless) {
      console.log("🖥️  [HEADLESS] Modo headless activado (CI/CD pipeline)");
    }

    if (apiKey) {
      stagehandConfig.apiKey = apiKey;
    }

    // Configuración especial para Ollama (si es necesario)
    if (this.currentProvider === AIModelProvider.OLLAMA) {
      const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
      stagehandConfig.baseURL = ollamaBaseUrl;
    }

    // Configurar grabación de video E2E si está configurado
    // El directorio de video debe establecerse ANTES de llamar a initialize()
    if (env === "LOCAL") {
      const videoDirToUse = this.videoDir || path.join(process.cwd(), "reports", "videos");
      
      if (!fs.existsSync(videoDirToUse)) {
        fs.mkdirSync(videoDirToUse, { recursive: true });
      }
      
      // Stagehand puede aceptar opciones de contexto de Playwright a través de diferentes propiedades
      // Intentar múltiples formas de configurar el video
      try {
        // Método 1: contextOptions (si Stagehand lo soporta)
        stagehandConfig.contextOptions = {
          recordVideo: {
            dir: videoDirToUse,
            size: { width: 1920, height: 1080 }
          }
        };
        
        // Método 2: También intentar pasar directamente recordVideo (por si acaso)
        stagehandConfig.recordVideo = {
          dir: videoDirToUse,
          size: { width: 1920, height: 1080 }
        };
        
        console.log(`🎥 [VIDEO] Configuración de video habilitada: ${videoDirToUse}`);
        console.log(`🎥 [VIDEO] Se intentará grabar el video en: ${videoDirToUse}`);
      } catch (error: any) {
        console.warn(`⚠️  [VIDEO] No se pudo configurar video en Stagehand: ${error?.message || error}`);
        console.warn(`⚠️  [VIDEO] El video puede no estar disponible si Stagehand no soporta estas opciones`);
      }
    } else {
      // Para BROWSERBASE, la grabación puede estar limitada
      console.log(`ℹ️  [VIDEO] La grabación de video puede no estar disponible en entorno BROWSERBASE`);
    }

    this.stagehand = new Stagehand(stagehandConfig);

    try {
      await this.stagehand.init();
      
      // Configurar viewport para pantalla completa (100% de la pantalla)
      const page = this.getMainPage();
      if (page && typeof (page as any).setViewportSize === "function") {
        // Obtener dimensiones de pantalla disponibles
        const viewportSize = (page as any).viewportSize?.() || { width: 1920, height: 1080 };
        // Configurar al máximo disponible o usar valores grandes por defecto
        await (page as any).setViewportSize({ 
          width: Math.max(viewportSize.width || 1920, 1920), 
          height: Math.max(viewportSize.height || 1080, 1080) 
        });
        console.log(`✅ Viewport configurado para pantalla completa`);
      }
      
      // Intentar configurar el video directamente en el contexto de Playwright después de la inicialización
      if (env === "LOCAL" && this.videoDir) {
        try {
          const context = this.getBrowserContext();
          if (context) {
            // Intentar acceder a las opciones del contexto y configurar recordVideo
            // Nota: Esto puede no funcionar si Stagehand ya creó el contexto sin estas opciones
            const contextOptions = (context as any)._options || {};
            
            // Si el contexto no tiene recordVideo configurado, intentar agregarlo
            // Nota: Esto puede no funcionar si el contexto ya está creado
            if (!contextOptions.recordVideo) {
              console.log(`ℹ️  [VIDEO] El contexto ya está creado. El video puede no estar disponible.`);
              console.log(`ℹ️  [VIDEO] Stagehand puede requerir configuración de video antes de init().`);
            } else {
              console.log(`✅ [VIDEO] Video configurado en el contexto de Playwright`);
            }
          }
        } catch (error: any) {
          console.warn(`⚠️  [VIDEO] No se pudo acceder al contexto para configurar video: ${error?.message || error}`);
        }
      }
      
      console.log(`✅ Stagehand inicializado con ${this.currentProvider.toUpperCase()}`);
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      
      if (errorMessage.includes("quota") || errorMessage.includes("Quota exceeded")) {
        throw new Error(
          `❌ ERROR DE CUOTA DE API\n\n` +
          `Has excedido la cuota de la API de ${this.currentProvider.toUpperCase()}.\n\n` +
          `Soluciones:\n` +
          `1. Espera unos minutos y vuelve a intentar\n` +
          `2. Verifica tu uso en el dashboard del proveedor\n` +
          `3. Considera usar una API key diferente\n` +
          `4. O cambia a otro proveedor configurando MODEL_PROVIDER en .env\n\n` +
          `Error técnico: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes("API key") || errorMessage.includes("invalid") || errorMessage.includes("unauthorized")) {
        throw new Error(
          `❌ ERROR DE API KEY\n\n` +
          `La API key de ${this.currentProvider.toUpperCase()} no es válida o no tiene permisos.\n\n` +
          `Verifica:\n` +
          `1. Que la API key esté correcta en el archivo .env\n` +
          `2. Que la API key tenga los permisos necesarios\n` +
          `3. Obtén una nueva API key según el proveedor\n\n` +
          `Error técnico: ${errorMessage}`
        );
      }
      
      throw error;
    }
  }

  /**
   * Obtiene instrucciones para obtener API keys según el proveedor
   */
  private getApiKeyInstructions(provider: AIModelProvider): string {
    switch (provider) {
      case AIModelProvider.GEMINI:
        return "   - Gemini: https://aistudio.google.com/app/apikey";
      case AIModelProvider.PERPLEXITY:
        return "   - Perplexity: https://www.perplexity.ai/settings/api";
      case AIModelProvider.OLLAMA:
        return "   - Ollama: No requiere API key (ejecución local)";
      default:
        return "";
    }
  }

  /**
   * Obtiene la instancia de Stagehand
   */
  public getStagehand(): Stagehand {
    if (!this.stagehand) {
      throw new Error("Stagehand no ha sido inicializado. Llama a initialize() primero.");
    }
    return this.stagehand;
  }

  /**
   * Obtiene el contexto del navegador
   */
  public getBrowserContext(): any {
    return this.getStagehand().context;
  }

  /**
   * Obtiene la página principal
   */
  public getMainPage(): any {
    return this.getBrowserContext().pages()[0];
  }

  /**
   * Cierra la sesión de Stagehand
   */
  public async close(): Promise<void> {
    if (this.stagehand) {
      await this.stagehand.close();
      this.stagehand = null;
    }
  }

  /**
   * Obtiene el ID de sesión de Browserbase (si está disponible)
   */
  public getSessionId(): string | undefined {
    return this.stagehand?.browserbaseSessionID;
  }
}
