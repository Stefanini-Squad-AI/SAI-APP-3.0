/**
 * Registro centralizado de todos los pasos disponibles
 * Permite que cualquier test reutilice pasos de otros tests
 */
import { WebActions } from "../actions/WebActions";
import { ReportGenerator } from "../hooks/ReportGenerator";
import { AutomationClient } from "../configs/AutomationClient";
import { HomeSteps } from "../steps/home.steps";
import { LanguagePtSteps } from "../steps/language-pt.steps";
import { ServicesSteps } from "../steps/services.steps";
import { CommonSteps } from "../steps/common.steps";

export type StepHandler = (...args: any[]) => Promise<void>;

export class StepRegistry {
  private steps: Map<string, StepHandler> = new Map();
  private actions: WebActions;
  private reportGenerator: ReportGenerator;
  private client: AutomationClient;

  constructor(actions: WebActions, reportGenerator: ReportGenerator, client: AutomationClient) {
    this.actions = actions;
    this.reportGenerator = reportGenerator;
    this.client = client;
    this.registerAllSteps();
  }

  private registerAllSteps(): void {
    const homeSteps = new HomeSteps(this.actions, this.reportGenerator);
    const languagePtSteps = new LanguagePtSteps(this.actions, this.reportGenerator);
    const servicesSteps = new ServicesSteps(this.actions, this.reportGenerator);
    const commonSteps = new CommonSteps(this.actions, this.reportGenerator, this.client);

    // Common Steps - Given
    this.register("que el navegador está abierto", () => commonSteps.givenBrowserIsOpen());
    this.register(/^navego a la URL "([^"]+)"$/, (url: string) => commonSteps.givenNavigateToUrl(url));

    // Common Steps - Then
    this.register(/^la URL debe contener "([^"]+)"$/, (text: string) => commonSteps.thenUrlShouldContain(text));

    // Home Steps - Given
    this.register("que navego a la página home de Tu Crédito Online", () => homeSteps.givenNavigateToHomePage());

    // Home Steps - When
    this.register(
      "presiono en el dropdown de cambio de idioma al lado del botón de login de admin",
      () => homeSteps.whenClickLanguageDropdown()
    );
    this.register("selecciono el idioma inglés", () => homeSteps.whenSelectEnglishLanguage());
    this.register("selecciono el idioma portugués", () => languagePtSteps.whenSelectPortugueseLanguage());

    // Home Steps - Then
    this.register(
      /^debo ver los títulos de secciones "([^"]+)", "([^"]+)" y "([^"]+)"$/,
      (title1: string, title2: string, title3: string) =>
        homeSteps.thenShouldSeeSectionTitles(title1, title2, title3)
    );

    // Services Steps (TCO-19) - Given
    this.register("que navego a la página de la aplicación", () => servicesSteps.givenNavigateToAppPage());

    // Services Steps - When
    this.register(
      /^hago clic en la opción del menú superior "([^"]+)"$/,
      (menuOption: string) => servicesSteps.whenClickMenuServices(menuOption)
    );

    // Services Steps - Then
    this.register(
      /^debo ver en la vista de servicios los títulos "([^"]+)" y "([^"]+)"$/,
      (title1: string, title2: string) => servicesSteps.thenShouldSeeServicesTitles(title1, title2)
    );
  }

  /**
   * Registra un paso con su handler
   */
  register(pattern: string | RegExp, handler: StepHandler): void {
    this.steps.set(pattern.toString(), handler);
  }

  /**
   * Encuentra y ejecuta un paso
   */
  async executeStep(stepText: string, context?: Record<string, string>): Promise<void> {
    let normalizedText = stepText.trim();
    
    // Remover palabras clave Gherkin al inicio si existen
    normalizedText = normalizedText.replace(/^(Dado|Given|Cuando|When|Entonces|Then|Y|And|Pero|But)\s+/i, "").trim();

    // Reemplazar placeholders si hay contexto
    if (context) {
      Object.keys(context).forEach(key => {
        const regex = new RegExp(`<${key}>`, "g");
        normalizedText = normalizedText.replace(regex, context[key]);
      });
    }

    console.log(`🔍 Buscando paso: "${normalizedText}"`);

    // Buscar paso que coincida
    for (const [pattern, handler] of this.steps.entries()) {
      if (pattern.startsWith("/")) {
        // Es un RegExp
        try {
          const regexPattern = pattern.slice(1, -1);
          const regex = new RegExp(regexPattern, "i");
          const match = normalizedText.match(regex);
          if (match) {
            console.log(`✅ Paso encontrado (regex): "${pattern}" -> "${normalizedText}"`);
            const args = match.slice(1);
            return await handler(...args);
          }
        } catch (e) {
          // Si falla el regex, continuar con el siguiente
          continue;
        }
      } else {
        // Es un string exacto
        if (normalizedText.toLowerCase() === pattern.toLowerCase()) {
          console.log(`✅ Paso encontrado (exacto): "${pattern}" -> "${normalizedText}"`);
          return await handler();
        }
      }
    }

    console.error(`❌ Paso NO encontrado: "${stepText}" (normalizado: "${normalizedText}")`);
    console.error(`📋 Pasos registrados:`, Array.from(this.steps.keys()));
    throw new Error(`Step definition no encontrada para: "${stepText}"`);
  }

  /**
   * Permite que otros módulos registren sus propios pasos
   */
  addSteps(steps: Map<string, StepHandler>): void {
    steps.forEach((handler, pattern) => {
      this.steps.set(pattern, handler);
    });
  }
}
