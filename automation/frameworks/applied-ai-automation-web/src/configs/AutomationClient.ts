import { StagehandConfig } from "./StagehandConfig";
import { z } from "zod/v3";

/**
 * Cliente de automatización que abstrae completamente Stagehand
 * Proporciona una interfaz limpia para los tests sin referencias directas al framework
 */
export class AutomationClient {
  private config: StagehandConfig;

  constructor() {
    this.config = StagehandConfig.getInstance();
  }

  /**
   * Inicializa el cliente de automatización
   */
  async initialize(): Promise<void> {
    await this.config.initialize();
  }

  /**
   * Navega a una URL específica y espera carga completa
   * FIX: Ahora espera carga visual completa para evitar pantalla negra
   */
  async navigateTo(url: string): Promise<void> {
    const page = this.config.getMainPage();
    
    // Navegar con opciones de espera
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Esperar adicional para asegurar renderizado visual
    await this.wait(2000);
  }

  /**
   * Ejecuta una acción usando lenguaje natural
   */
  async executeAction(instruction: string): Promise<void> {
    try {
      const stagehand = this.config.getStagehand();
      await stagehand.act(instruction);
    } catch (error: any) {
      this.handleApiError(error, "executeAction");
      throw error;
    }
  }

  /**
   * Extrae información estructurada de la página
   */
  async extractData<T>(instruction: string, schema: z.ZodSchema<T>): Promise<T> {
    try {
      const stagehand = this.config.getStagehand();
      return await stagehand.extract(instruction, schema);
    } catch (error: any) {
      this.handleApiError(error, "extractData");
      throw error;
    }
  }

  /**
   * Observa elementos disponibles en la página
   */
  async observeElements(instruction: string): Promise<any> {
    try {
      const stagehand = this.config.getStagehand();
      return await stagehand.observe(instruction);
    } catch (error: any) {
      this.handleApiError(error, "observeElements");
      throw error;
    }
  }

  /**
   * Maneja errores de API y proporciona mensajes más claros
   */
  private handleApiError(error: any, operation: string): void {
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes("quota") || errorMessage.includes("Quota exceeded")) {
      console.error(`\n⚠️  Error de cuota en ${operation}:`);
      console.error("La API de Gemini ha excedido su cuota gratuita.");
      console.error("Consulta SOLUCION_ERRORES_API.md para más información.\n");
    }
  }

  /**
   * Obtiene la URL actual
   */
  getCurrentUrl(): string {
    return this.config.getMainPage().url();
  }

  /**
   * Espera un tiempo específico
   */
  async wait(milliseconds: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  /**
   * Toma una captura de pantalla
   */
  async takeScreenshot(path: string): Promise<void> {
    const page = this.config.getMainPage();
    await page.screenshot({ path, fullPage: true });
  }

  /**
   * Cierra el cliente de automatización
   * IMPORTANTE: El video de Playwright se guarda cuando se cierra el contexto
   */
  async close(): Promise<void> {
    // Esperar un momento antes de cerrar para asegurar que todas las acciones estén completas
    await this.wait(500);
    await this.config.close();
    // Esperar un momento después de cerrar para que Playwright termine de guardar el video
    await this.wait(1000);
  }

  /**
   * Obtiene el ID de sesión (para reportes)
   */
  getSessionId(): string | undefined {
    return this.config.getSessionId();
  }

  /**
   * Obtiene la página principal
   */
  getMainPage(): any {
    return this.config.getMainPage();
  }
}

