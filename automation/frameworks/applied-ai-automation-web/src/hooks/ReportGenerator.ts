import * as fs from "fs";
import * as path from "path";
import { AutomationClient } from "../configs/AutomationClient";

export interface ActionLog {
  timestamp: string;
  level: "INFO" | "SUCCESS" | "ERROR" | "WARNING";
  message: string;
  element?: string;
  action?: string;
  details?: string;
}

export interface TestStep {
  stepNumber: number;
  description: string;
  status: "PASSED" | "FAILED" | "SKIPPED" | "PENDING" | "ABORTED" | "BROKEN" | "COMPROMISED";
  screenshot?: string;
  timestamp: string;
  duration?: number;
  error?: string;
  tags?: string[];
  feature?: string;
  logs?: ActionLog[];
}

export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
}

export interface TestCase {
  id: string;
  scenarioName: string;
  featureName: string;
  status: "PASSED" | "FAILED" | "SKIPPED" | "PENDING" | "ABORTED" | "BROKEN" | "COMPROMISED";
  startTime: string;
  endTime: string;
  duration: number;
  steps: TestStep[];
  example?: Record<string, string>;
  error?: string;
}

export interface Scenario {
  name: string;
  featureName: string;
  status: "PASSED" | "FAILED";
  testCases: TestCase[];
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface Feature {
  name: string;
  scenarios: Scenario[];
  totalScenarios: number;
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  successRate: number;
}

export interface TestReport {
  testName: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "PASSED" | "FAILED";
  steps: TestStep[];
  browserInfo?: BrowserInfo;
  sessionId?: string;
  summary: {
    totalSteps: number;
    passedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    pendingSteps: number;
    abortedSteps: number;
    brokenSteps: number;
    compromisedSteps: number;
    successRate: number;
    totalScenarios: number;
    totalTestCases: number;
    passedTestCases: number;
    failedTestCases: number;
  };
  conclusion: string;
  testData?: Record<string, any>;
  tags?: string[];
  features?: Feature[];
  scenarios?: Scenario[];
  testCases?: TestCase[];
  successLogs?: ActionLog[];
  errorLogs?: ActionLog[];
}

export class ReportGenerator {
  private client: AutomationClient;
  private steps: TestStep[] = [];
  private testName: string;
  private startTime: Date;
  private testData: Record<string, any> = {};
  private browserInfo?: BrowserInfo;
  private baseReportsDir: string;
  private currentReportDir: string;
  private screenshotsDir: string;
  private videoPath?: string;
  private videoRecorder?: any;
  private version: number = 1;
  private tags: Set<string> = new Set();
  private featureNames: Set<string> = new Set();
  private successLogs: ActionLog[] = [];
  private errorLogs: ActionLog[] = [];
  private currentStepLogs: ActionLog[] = [];
  private scenarios: Scenario[] = [];
  private testCases: TestCase[] = [];
  private features: Feature[] = [];
  private currentScenario: Scenario | null = null;
  private currentTestCase: TestCase | null = null;
  private currentFeature: Feature | null = null;

  constructor(client: AutomationClient, testName: string) {
    this.client = client;
    this.testName = testName;
    this.startTime = new Date();
    this.baseReportsDir = path.join(process.cwd(), "reports");
    this.currentReportDir = this.createReportDirectory();
    this.screenshotsDir = path.join(this.currentReportDir, "screenshots");
    this.videoPath = path.join(this.currentReportDir, `test-recording-${Date.now()}.webm`);

    this.ensureDirectoriesExist();
    this.startVideoRecording();
    // No recolectar información del navegador en el constructor
    // Se recolectará cuando sea necesario (después de la inicialización)
    // this.collectBrowserInfo();
  }

  private createReportDirectory(): string {
    const dateStr = this.startTime.toISOString().split("T")[0].replace(/-/g, "");
    const testDirName = `${this.testName}-${dateStr}`;
    const testDir = path.join(this.baseReportsDir, testDirName);

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
      this.version = 1;
    } else {
      const existingVersions = fs.readdirSync(testDir)
        .filter((item) => item.startsWith(`${testDirName}-v`))
        .map((item) => {
          const match = item.match(/v(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        });
      this.version = existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;
    }

    const versionDirName = `${testDirName}-v${this.version}`;
    const versionDir = path.join(testDir, versionDirName);
    fs.mkdirSync(versionDir, { recursive: true });

    return versionDir;
  }

  /**
   * Obtiene el directorio actual del reporte
   * Útil para configurar el video antes de inicializar Stagehand
   */
  public getCurrentReportDir(): string {
    return this.currentReportDir;
  }

  /**
   * Establece el directorio donde se guardará el video
   * Útil cuando el video se configura antes de crear el ReportGenerator
   */
  public setVideoDirectory(videoDir: string): void {
    // El video se guardará en el directorio especificado
    // Actualizar la ruta del video para que apunte al archivo final
    this.videoPath = path.join(videoDir, `test-recording-${Date.now()}.webm`);
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }
  }

  private async collectBrowserInfo(): Promise<void> {
    try {
      const page = this.client.getMainPage();
      const userAgent = await (page as any).evaluate(() => (globalThis as any).navigator?.userAgent || "Unknown");
      const viewport = (page as any).viewportSize?.() || null;

      this.browserInfo = {
        name: "Chrome",
        version: userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || "Unknown",
        platform: process.platform,
        userAgent,
        viewport: {
          width: viewport?.width || 1920,
          height: viewport?.height || 1080,
        },
      };
    } catch (error) {
      console.warn("No se pudo recolectar información del navegador:", error);
      this.browserInfo = {
        name: "Chrome",
        version: "Unknown",
        platform: process.platform,
        userAgent: "Unknown",
        viewport: { width: 1920, height: 1080 },
      };
    }
  }

  setTestData(key: string, value: any): void {
    this.testData[key] = value;
  }

  addTag(tag: string): void {
    this.tags.add(tag);
  }

  addFeature(feature: string): void {
    this.featureNames.add(feature);
  }

  private ensureDirectoriesExist(): void {
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  /**
   * Inicia la grabación de video E2E del test
   * Nota: La grabación de video debe estar habilitada en el contexto de Playwright antes de crear las páginas.
   * Si Stagehand no expone esta configuración, el video puede no estar disponible.
   */
  private async startVideoRecording(): Promise<void> {
    try {
      console.log(`🎥 [VIDEO] Iniciando grabación de video E2E...`);
      console.log(`🎥 [VIDEO] Ruta de destino: ${this.videoPath}`);
      this.addInfoLog("Iniciando grabación de video E2E", undefined, "video", `Ruta: ${path.basename(this.videoPath!)}`);
      
      const page = this.client.getMainPage();
      if (!page) {
        console.warn(`⚠️  [VIDEO] No hay página disponible para grabar`);
        this.addWarningLog("La grabación de video no está disponible", undefined, "video", "No hay página disponible");
        return;
      }

      // En Playwright, el video se obtiene del contexto de la página
      // Intentar diferentes formas de acceder al video
      try {
        // Método 1: Intentar obtener el video directamente de la página
        if (typeof (page as any).video === "function") {
          this.videoRecorder = await (page as any).video().catch(() => null);
          if (this.videoRecorder) {
            console.log(`✅ [VIDEO] Grabación iniciada correctamente (método página.video())`);
            this.addSuccessLog("Grabación de video E2E iniciada", undefined, "video", `Ruta: ${path.basename(this.videoPath!)}`);
            return;
          }
        }

        // Método 2: Intentar obtener el contexto y luego el video
        const context = (page as any).context?.();
        if (context) {
          // Verificar si el contexto tiene configuración de video
          const contextOptions = (context as any)._options || {};
          if (contextOptions.recordVideo) {
            console.log(`✅ [VIDEO] Grabación configurada en el contexto`);
            // El video se guardará automáticamente cuando se cierre el contexto
            this.addInfoLog("Grabación de video configurada en el contexto", undefined, "video", "El video se guardará al finalizar el test");
          } else {
            console.warn(`⚠️  [VIDEO] La grabación de video no está habilitada en el contexto`);
            console.warn(`⚠️  [VIDEO] Para habilitar la grabación, configure 'recordVideo' en las opciones del contexto de Playwright`);
            this.addWarningLog("La grabación de video no está habilitada", undefined, "video", "Configure 'recordVideo' en las opciones del contexto de Playwright");
          }
        } else {
          console.warn(`⚠️  [VIDEO] No se pudo obtener el contexto del navegador`);
          this.addWarningLog("No se pudo obtener el contexto del navegador", undefined, "video", "El contexto no está disponible");
        }
      } catch (error: any) {
        console.warn(`⚠️  [VIDEO] Error al iniciar grabación: ${error?.message || error}`);
        this.addWarningLog("Error al iniciar grabación de video", undefined, "video", error?.message || String(error));
      }
    } catch (error: any) {
      // La grabación de video es opcional, no fallar si no está disponible
      console.warn(`⚠️  [VIDEO] Error general al iniciar grabación: ${error?.message || error}`);
      this.addWarningLog("Error general al iniciar grabación de video", undefined, "video", error?.message || String(error));
    }
  }

  /**
   * Detiene y guarda la grabación de video E2E
   */
  private async stopVideoRecording(): Promise<void> {
    try {
      console.log(`🎥 [VIDEO] Deteniendo grabación de video E2E...`);
      this.addInfoLog("Deteniendo grabación de video E2E", undefined, "video", "Guardando video...");
      
      let videoSaved = false;
      
      // Método 1: Si tenemos un objeto de video guardado
      if (this.videoRecorder && this.videoPath) {
        try {
          await this.videoRecorder.saveAs(this.videoPath);
          await this.videoRecorder.delete();
          console.log(`✅ [VIDEO] Video guardado exitosamente: ${this.videoPath}`);
          this.addSuccessLog("Video E2E guardado exitosamente", undefined, "video", `Ruta: ${path.basename(this.videoPath)}`);
          videoSaved = true;
        } catch (error: any) {
          console.warn(`⚠️  [VIDEO] Error al guardar video desde recorder: ${error?.message || error}`);
        }
      }
      
      // Método 2: Intentar obtener el video del contexto/página
      if (!videoSaved) {
        const page = this.client.getMainPage();
        if (page) {
          try {
            // Intentar obtener el video de la página
            if (typeof (page as any).video === "function") {
              const video = await (page as any).video().catch(() => null);
              if (video && this.videoPath) {
                await video.saveAs(this.videoPath);
                await video.delete();
                console.log(`✅ [VIDEO] Video guardado exitosamente desde página: ${this.videoPath}`);
                this.addSuccessLog("Video E2E guardado exitosamente", undefined, "video", `Ruta: ${path.basename(this.videoPath)}`);
                videoSaved = true;
              }
            }
            
            // Intentar obtener el video del contexto
            if (!videoSaved) {
              const context = (page as any).context?.();
              if (context) {
                // Si el contexto tiene recordVideo configurado, el video se guarda automáticamente
                // Intentar buscar el archivo de video en el directorio de videos del contexto
                const contextOptions = (context as any)._options || {};
                if (contextOptions.recordVideo) {
                  const videoDir = contextOptions.recordVideo.dir || path.dirname(this.videoPath || "");
                  
                  // Esperar un momento para que Playwright termine de guardar el video
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // Buscar archivos de video en el directorio
                  if (fs.existsSync(videoDir)) {
                    const videoFiles = fs.readdirSync(videoDir)
                      .filter(file => file.endsWith('.webm') || file.endsWith('.mp4'))
                      .sort((a, b) => {
                        // Ordenar por fecha de modificación (más reciente primero)
                        const statA = fs.statSync(path.join(videoDir, a));
                        const statB = fs.statSync(path.join(videoDir, b));
                        return statB.mtime.getTime() - statA.mtime.getTime();
                      });
                    
                    if (videoFiles.length > 0 && this.videoPath) {
                      // Tomar el video más reciente y copiarlo/moverlo a nuestra ubicación
                      const sourceVideoPath = path.join(videoDir, videoFiles[0]);
                      
                      // Esperar a que el archivo esté completamente escrito
                      let retries = 10;
                      while (retries > 0) {
                        try {
                          const stats = fs.statSync(sourceVideoPath);
                          // Si el archivo tiene tamaño y no se está modificando, está listo
                          if (stats.size > 0) {
                            // Esperar un poco más para asegurar que está completamente escrito
                            await new Promise(resolve => setTimeout(resolve, 500));
                            break;
                          }
                        } catch (e) {
                          // Archivo aún no existe o no es accesible
                        }
                        await new Promise(resolve => setTimeout(resolve, 200));
                        retries--;
                      }
                      
                      if (fs.existsSync(sourceVideoPath) && this.videoPath) {
                        fs.copyFileSync(sourceVideoPath, this.videoPath);
                        console.log(`✅ [VIDEO] Video copiado desde contexto: ${this.videoPath}`);
                        this.addSuccessLog("Video E2E guardado exitosamente", undefined, "video", `Ruta: ${path.basename(this.videoPath)}`);
                        videoSaved = true;
                        
                        // Opcional: eliminar el archivo original si está en un directorio temporal
                        if (videoDir !== path.dirname(this.videoPath)) {
                          try {
                            fs.unlinkSync(sourceVideoPath);
                          } catch (e) {
                            // Ignorar errores al eliminar
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (error: any) {
            console.warn(`⚠️  [VIDEO] Error al obtener video del contexto: ${error?.message || error}`);
          }
        }
      }
      
      // Método 4: Buscar el video en directorios comunes de Playwright
      if (!videoSaved) {
        const possibleVideoDirs = [
          path.join(process.cwd(), "reports", "temp-videos"),
          path.join(process.cwd(), "reports", "videos"),
          path.dirname(this.videoPath || ""),
          path.join(process.cwd(), "test-results"),
        ];
        
        for (const videoDir of possibleVideoDirs) {
          if (fs.existsSync(videoDir)) {
            const videoFiles = fs.readdirSync(videoDir)
              .filter(file => file.endsWith('.webm') || file.endsWith('.mp4'))
              .sort((a, b) => {
                const statA = fs.statSync(path.join(videoDir, a));
                const statB = fs.statSync(path.join(videoDir, b));
                return statB.mtime.getTime() - statA.mtime.getTime();
              });
            
            if (videoFiles.length > 0 && this.videoPath) {
              const sourceVideo = path.join(videoDir, videoFiles[0]);
              // Verificar que el archivo tenga un tamaño razonable (> 10KB)
              const stats = fs.statSync(sourceVideo);
              if (stats.size > 10240) {
                fs.copyFileSync(sourceVideo, this.videoPath);
                console.log(`✅ [VIDEO] Video encontrado y copiado desde: ${sourceVideo}`);
                this.addSuccessLog("Video E2E guardado exitosamente", undefined, "video", `Ruta: ${path.basename(this.videoPath)}`);
                videoSaved = true;
                
                // Eliminar el archivo original si está en un directorio temporal
                if (videoDir !== path.dirname(this.videoPath)) {
                  try {
                    fs.unlinkSync(sourceVideo);
                  } catch (e) {
                    // Ignorar errores al eliminar
                  }
                }
                break;
              }
            }
          }
        }
      }
      
      if (!videoSaved) {
        console.warn(`⚠️  [VIDEO] No se pudo guardar el video. La grabación puede no estar habilitada en el contexto del navegador.`);
        console.warn(`⚠️  [VIDEO] Verifique que Stagehand esté configurado para grabar video o que el contexto de Playwright tenga recordVideo habilitado.`);
        this.addWarningLog("No se pudo guardar el video", undefined, "video", "La grabación de video no está habilitada en el contexto del navegador");
      }
    } catch (error: any) {
      console.warn(`⚠️  [VIDEO] Error al guardar el video: ${error?.message || error}`);
      this.addErrorLog("Error al guardar el video E2E", undefined, "video", error?.message || String(error));
    }
  }

  /**
   * Agrega un log de acción exitosa
   */
  addSuccessLog(message: string, element?: string, action?: string, details?: string): void {
    const log: ActionLog = {
      timestamp: new Date().toISOString(),
      level: "SUCCESS",
      message,
      element,
      action,
      details,
    };
    this.successLogs.push(log);
    this.currentStepLogs.push(log);
    console.log(`✅ ${message}${element ? ` - Elemento: ${element}` : ""}${action ? ` - Acción: ${action}` : ""}`);
  }

  /**
   * Agrega un log de error
   */
  addErrorLog(message: string, element?: string, action?: string, details?: string): void {
    const log: ActionLog = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      message,
      element,
      action,
      details,
    };
    this.errorLogs.push(log);
    this.currentStepLogs.push(log);
    console.error(`❌ ${message}${element ? ` - Elemento: ${element}` : ""}${action ? ` - Acción: ${action}` : ""}`);
  }

  /**
   * Agrega un log informativo
   */
  addInfoLog(message: string, element?: string, action?: string, details?: string): void {
    const log: ActionLog = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      message,
      element,
      action,
      details,
    };
    this.currentStepLogs.push(log);
    console.info(`ℹ️  ${message}${element ? ` - Elemento: ${element}` : ""}${action ? ` - Acción: ${action}` : ""}`);
  }

  /**
   * Agrega un log de advertencia
   */
  addWarningLog(message: string, element?: string, action?: string, details?: string): void {
    const log: ActionLog = {
      timestamp: new Date().toISOString(),
      level: "WARNING",
      message,
      element,
      action,
      details,
    };
    this.currentStepLogs.push(log);
    console.warn(`⚠️  ${message}${element ? ` - Elemento: ${element}` : ""}${action ? ` - Acción: ${action}` : ""}`);
  }

  async addStep(
    description: string,
    takeScreenshot: boolean = true,
    actions?: any,
    tags?: string[],
    feature?: string,
    actionDetails?: { element?: string; action?: string; instruction?: string }
  ): Promise<void> {
    this.currentStepNumber++;
    const stepStartTime = new Date();
    
    // Reset logs del paso actual
    this.currentStepLogs = [];
    
    // Agregar log de inicio del paso
    this.addInfoLog(`Iniciando paso: ${description}`, actionDetails?.element, actionDetails?.action, actionDetails?.instruction);
    
    const screenshotPath = takeScreenshot
      ? path.join(this.screenshotsDir, `step_${this.currentStepNumber}_${Date.now()}.png`)
      : undefined;

    if (takeScreenshot && screenshotPath && actions) {
      try {
        await actions.takeScreenshot(screenshotPath, true);
        this.addSuccessLog(`Screenshot capturado: ${path.basename(screenshotPath)}`);
      } catch (error: any) {
        this.addErrorLog(`No se pudo tomar captura en el paso ${this.currentStepNumber}`, undefined, "takeScreenshot", error?.message);
        console.warn(`No se pudo tomar captura en el paso ${this.currentStepNumber}:`, error);
      }
    }

    if (tags) {
      tags.forEach(tag => this.tags.add(tag));
    }

    if (feature) {
      this.featureNames.add(feature);
    }

    const stepDuration = Date.now() - stepStartTime.getTime();
    this.addSuccessLog(`Paso completado exitosamente`, actionDetails?.element, actionDetails?.action, `Duración: ${stepDuration}ms`);

    const step: TestStep = {
      stepNumber: this.currentStepNumber,
      description,
      status: "PASSED",
      screenshot: screenshotPath,
      timestamp: new Date().toISOString(),
      duration: stepDuration,
      tags,
      feature,
      logs: [...this.currentStepLogs], // Copiar logs del paso actual
    };

    this.steps.push(step);
    
    // Asignar el paso directamente al test case actual si existe
    // Esto asegura que los pasos se muestren correctamente en el reporte
    if (this.currentTestCase) {
      this.currentTestCase.steps.push(step);
    }
  }

  private currentStepNumber: number = 0;

  /**
   * Inicia el tracking de un escenario
   */
  startScenario(scenarioName: string, featureName: string): void {
    const scenario: Scenario = {
      name: scenarioName,
      featureName: featureName,
      status: "PASSED",
      testCases: [],
      totalTestCases: 0,
      passedTestCases: 0,
      failedTestCases: 0,
      startTime: new Date().toISOString(),
      endTime: "",
      duration: 0,
    };
    this.currentScenario = scenario;
    this.scenarios.push(scenario);
  }

  /**
   * Finaliza el tracking de un escenario
   */
  endScenario(): void {
    if (this.currentScenario) {
      this.currentScenario.endTime = new Date().toISOString();
      const start = new Date(this.currentScenario.startTime).getTime();
      const end = new Date(this.currentScenario.endTime).getTime();
      this.currentScenario.duration = end - start;
      this.currentScenario.totalTestCases = this.currentScenario.testCases.length;
      this.currentScenario.passedTestCases = this.currentScenario.testCases.filter(tc => tc.status === "PASSED").length;
      this.currentScenario.failedTestCases = this.currentScenario.testCases.filter(tc => tc.status === "FAILED").length;
      this.currentScenario.status = this.currentScenario.failedTestCases > 0 ? "FAILED" : "PASSED";
      this.currentScenario = null;
    }
  }

  /**
   * Inicia el tracking de un test case (ejemplo de Scenario Outline)
   */
  startTestCase(scenarioName: string, featureName: string, example?: Record<string, string>): void {
    const testCaseId = `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testCase: TestCase = {
      id: testCaseId,
      scenarioName,
      featureName,
      status: "PASSED",
      startTime: new Date().toISOString(),
      endTime: "",
      duration: 0,
      steps: [],
      example,
    };
    this.currentTestCase = testCase;
    this.testCases.push(testCase);
    
    // Agregar al escenario actual si existe
    if (this.currentScenario) {
      this.currentScenario.testCases.push(testCase);
    }
  }

  /**
   * Finaliza el tracking de un test case
   */
  endTestCase(status: "PASSED" | "FAILED" = "PASSED", error?: string): void {
    if (this.currentTestCase) {
      this.currentTestCase.endTime = new Date().toISOString();
      const start = new Date(this.currentTestCase.startTime).getTime();
      const end = new Date(this.currentTestCase.endTime).getTime();
      this.currentTestCase.duration = end - start;
      this.currentTestCase.status = status;
      if (error) {
        this.currentTestCase.error = error;
      }
      // Los pasos se agregarán cuando se genere el reporte
      this.currentTestCase = null;
    }
  }

  markStepAsFailed(error: string, element?: string, action?: string): void {
    if (this.steps.length > 0) {
      const lastStep = this.steps[this.steps.length - 1];
      lastStep.status = "FAILED";
      lastStep.error = error;
      
      // Marcar test case como fallido si existe
      if (this.currentTestCase) {
        this.currentTestCase.status = "FAILED";
        this.currentTestCase.error = error;
      }
      
      // Agregar log de error
      this.addErrorLog(`Paso falló: ${lastStep.description}`, element, action, error);
    } else {
      // Si no hay pasos, agregar error general
      this.addErrorLog("Error en la ejecución del test", element, action, error);
    }
  }

  markStepAs(status: TestStep["status"]): void {
    if (this.steps.length > 0) {
      const lastStep = this.steps[this.steps.length - 1];
      lastStep.status = status;
    }
  }

  async generateReport(status: "PASSED" | "FAILED" = "PASSED"): Promise<string> {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    // Recolectar información del navegador antes de generar el reporte
    // (ahora que el cliente está inicializado)
    if (!this.browserInfo) {
      await this.collectBrowserInfo();
    }

    // Finalizar test case actual si existe
    if (this.currentTestCase) {
      this.endTestCase(status);
    }
    
    // Finalizar escenario actual si existe
    if (this.currentScenario) {
      this.endScenario();
    }
    
    // Asignar pasos a test cases si no se asignaron automáticamente
    // Esto es un respaldo en caso de que algún paso no se haya asignado correctamente
    // Los pasos ya deberían estar asignados directamente cuando se agregaron, pero verificamos
    for (const testCase of this.testCases) {
      // Si el test case no tiene pasos asignados, intentar asignarlos
      if (testCase.steps.length === 0) {
        // Buscar pasos que pertenecen a este test case basándose en el tiempo
        const testCaseStartTime = new Date(testCase.startTime).getTime();
        const testCaseEndTime = testCase.endTime ? new Date(testCase.endTime).getTime() : Date.now();
        
        const testCaseSteps = this.steps.filter(step => {
          const stepTime = new Date(step.timestamp).getTime();
          // Excluir pasos marcadores
          if (step.description.includes("Ejecutando ejemplo") || step.description.includes("Ejecutando escenario")) {
            return false;
          }
          // Incluir pasos que están dentro del rango de tiempo del test case
          return stepTime >= testCaseStartTime && stepTime <= testCaseEndTime;
        });
        
        testCase.steps = testCaseSteps;
      }
    }

    const passedSteps = this.steps.filter((s) => s.status === "PASSED").length;
    const failedSteps = this.steps.filter((s) => s.status === "FAILED").length;
    const skippedSteps = this.steps.filter((s) => s.status === "SKIPPED").length;
    const pendingSteps = this.steps.filter((s) => s.status === "PENDING").length;
    const abortedSteps = this.steps.filter((s) => s.status === "ABORTED").length;
    const brokenSteps = this.steps.filter((s) => s.status === "BROKEN").length;
    const compromisedSteps = this.steps.filter((s) => s.status === "COMPROMISED").length;
    const totalSteps = this.steps.length;
    const successRate = totalSteps > 0 ? Math.round((passedSteps / totalSteps) * 100) : 0;

    // Calcular estadísticas de test cases y escenarios
    const totalTestCases = this.testCases.length;
    const passedTestCases = this.testCases.filter(tc => tc.status === "PASSED").length;
    const failedTestCases = this.testCases.filter(tc => tc.status === "FAILED").length;
    const totalScenarios = this.scenarios.length;

    // Agrupar escenarios por feature
    const featuresMap = new Map<string, Feature>();
    for (const scenario of this.scenarios) {
      if (!featuresMap.has(scenario.featureName)) {
        featuresMap.set(scenario.featureName, {
          name: scenario.featureName,
          scenarios: [],
          totalScenarios: 0,
          totalTestCases: 0,
          passedTestCases: 0,
          failedTestCases: 0,
          successRate: 0,
        });
      }
      const feature = featuresMap.get(scenario.featureName)!;
      feature.scenarios.push(scenario);
    }

    // Calcular estadísticas por feature
    const features = Array.from(featuresMap.values()).map(feature => {
      feature.totalScenarios = feature.scenarios.length;
      feature.totalTestCases = feature.scenarios.reduce((sum, s) => sum + s.totalTestCases, 0);
      feature.passedTestCases = feature.scenarios.reduce((sum, s) => sum + s.passedTestCases, 0);
      feature.failedTestCases = feature.scenarios.reduce((sum, s) => sum + s.failedTestCases, 0);
      feature.successRate = feature.totalTestCases > 0 
        ? Math.round((feature.passedTestCases / feature.totalTestCases) * 100) 
        : 0;
      return feature;
    });

    const summary = {
      totalSteps,
      passedSteps,
      failedSteps,
      skippedSteps,
      pendingSteps,
      abortedSteps,
      brokenSteps,
      compromisedSteps,
      successRate,
      totalScenarios,
      totalTestCases,
      passedTestCases,
      failedTestCases,
    };

    const conclusion = this.generateConclusion(summary, status);

    const report: TestReport = {
      testName: this.testName,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      status,
      steps: this.steps,
      browserInfo: this.browserInfo,
      sessionId: this.client.getSessionId(),
      summary,
      conclusion,
      testData: Object.keys(this.testData).length > 0 ? this.testData : undefined,
      tags: Array.from(this.tags),
      features: features.length > 0 ? features : undefined,
      scenarios: this.scenarios.length > 0 ? this.scenarios : undefined,
      testCases: this.testCases.length > 0 ? this.testCases : undefined,
      successLogs: this.successLogs.length > 0 ? this.successLogs : undefined,
      errorLogs: this.errorLogs.length > 0 ? this.errorLogs : undefined,
    };

    // Detener grabación de video antes de generar el reporte
    // NOTA: El video se guarda cuando se cierra el contexto, así que lo hacemos antes de cerrar
    await this.stopVideoRecording();

    const htmlReport = this.generateHtmlReport(report);
    const reportPath = path.join(this.currentReportDir, `report.html`);
    const jsonPath = path.join(this.currentReportDir, `report.json`);

    fs.writeFileSync(reportPath, htmlReport, "utf-8");
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf-8");

    console.log(`\n📊 Reporte generado: ${reportPath}`);
    console.log(`📄 JSON generado: ${jsonPath}`);
    
    // Verificar si el video existe después de cerrar el contexto
    // El video puede haberse guardado después de stopVideoRecording()
    if (this.videoPath && fs.existsSync(this.videoPath)) {
      const videoStats = fs.statSync(this.videoPath);
      const videoSizeMB = (videoStats.size / (1024 * 1024)).toFixed(2);
      console.log(`🎥 Video generado: ${this.videoPath} (${videoSizeMB} MB)`);
    } else {
      // Intentar buscar el video en el directorio configurado
      const videoDir = path.dirname(this.videoPath || "");
      if (fs.existsSync(videoDir)) {
        const videoFiles = fs.readdirSync(videoDir)
          .filter(file => file.endsWith('.webm') || file.endsWith('.mp4'))
          .sort((a, b) => {
            const statA = fs.statSync(path.join(videoDir, a));
            const statB = fs.statSync(path.join(videoDir, b));
            return statB.mtime.getTime() - statA.mtime.getTime();
          });
        
        if (videoFiles.length > 0) {
          const foundVideo = path.join(videoDir, videoFiles[0]);
          // Actualizar la ruta del video si encontramos uno
          this.videoPath = foundVideo;
          console.log(`🎥 Video encontrado: ${foundVideo}`);
        }
      }
    }

    return reportPath;
  }

  private generateConclusion(summary: any, status: "PASSED" | "FAILED"): string {
    if (status === "PASSED") {
      return `✅ La prueba "${this.testName}" se ejecutó exitosamente. Se completaron ${summary.passedSteps} de ${summary.totalSteps} pasos correctamente (${summary.successRate}% de éxito).`;
    } else {
      return `❌ La prueba "${this.testName}" falló. ${summary.failedSteps} de ${summary.totalSteps} pasos fallaron (${summary.successRate}% de éxito). Revisar los errores detallados en el reporte.`;
    }
  }

  private generateHtmlReport(report: TestReport): string {
    const formatDuration = (ms: number) => {
      if (ms < 1000) return `${ms}ms`;
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
      if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
      return `${seconds}s`;
    };

    const formatTime = (isoString: string) => {
      const date = new Date(isoString);
      return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    const formatTimeShort = (isoString: string) => {
      const date = new Date(isoString);
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    const statusColor = report.status === "PASSED" ? "#28a745" : "#dc3545";
    const statusBg = report.status === "PASSED" ? "#d4edda" : "#f8d7da";
    const statusText = report.status === "PASSED" ? "PASSED" : "FAILED";

    // Calcular estadísticas de duración
    const durations = report.steps.map(s => s.duration || 0);
    const fastestStep = durations.length > 0 ? Math.min(...durations.filter(d => d > 0)) : 0;
    const slowestStep = durations.length > 0 ? Math.max(...durations) : 0;
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    // Categorizar duraciones por rangos
    const durationRanges = {
      "Under 1 second": durations.filter(d => d < 1000).length,
      "1 to 10 seconds": durations.filter(d => d >= 1000 && d < 10000).length,
      "10 to 30 seconds": durations.filter(d => d >= 10000 && d < 30000).length,
      "30 to 60 seconds": durations.filter(d => d >= 30000 && d < 60000).length,
      "1 to 2 minutes": durations.filter(d => d >= 60000 && d < 120000).length,
      "2 to 5 minutes": durations.filter(d => d >= 120000 && d < 300000).length,
      "5 to 10 minutes": durations.filter(d => d >= 300000 && d < 600000).length,
      "10 minutes or over": durations.filter(d => d >= 600000).length,
    };

    // Generar tabla de pasos para DataTables
    const stepsTableRows = report.steps
      .map((step, index) => {
        const stepStatusColor = this.getStatusColor(step.status);
        const stepStatusIcon = this.getStatusIcon(step.status);
        const screenshotPath = step.screenshot
          ? path.relative(this.currentReportDir, step.screenshot).replace(/\\/g, "/")
          : null;

        return `
          <tr class="step-row ${step.status.toLowerCase()}" data-step="${step.stepNumber}">
            <td>${step.stepNumber}</td>
            <td>${this.escapeHtml(step.description)}</td>
            <td><span class="status-badge" style="background: ${stepStatusColor.bg}; color: ${stepStatusColor.color};">
              ${stepStatusIcon} ${step.status}
            </span></td>
            <td>${formatDuration(step.duration || 0)}</td>
            <td>${formatTimeShort(step.timestamp)}</td>
            <td>${screenshotPath ? `<a href="#" onclick="openScreenshotModal('${screenshotPath}'); return false;">Ver</a>` : '-'}</td>
            <td>${step.error ? `<span class="error-text">${this.escapeHtml(step.error.substring(0, 50))}...</span>` : '-'}</td>
          </tr>
        `;
      })
      .join("");

    // Generar HTML de pasos detallados
    const stepsHtml = report.steps
      .map((step) => {
        const stepStatusColor = this.getStatusColor(step.status);
        const stepStatusIcon = this.getStatusIcon(step.status);
        
        const screenshotPath = step.screenshot
          ? path.relative(this.currentReportDir, step.screenshot).replace(/\\/g, "/")
          : null;

        return `
          <div class="step-item ${step.status.toLowerCase()}" data-step="${step.stepNumber}">
            <div class="step-header">
              <div class="step-info">
                <span class="step-status" style="background: ${stepStatusColor.bg}; color: ${stepStatusColor.color};">
                  ${stepStatusIcon} ${step.status}
                </span>
                <span class="step-name">Step ${step.stepNumber}: ${this.escapeHtml(step.description)}</span>
              </div>
              <div class="step-meta">
                <span class="step-duration">${formatDuration(step.duration || 0)}</span>
                <span class="step-time">${formatTimeShort(step.timestamp)}</span>
              </div>
            </div>
            ${screenshotPath ? `
            <div class="step-screenshot">
              <img src="${screenshotPath}" alt="Step ${step.stepNumber}" onclick="openScreenshotModal('${screenshotPath}')" />
            </div>
            ` : ""}
            ${step.error ? `
            <div class="step-error">
              <strong>Error:</strong>
              <pre>${this.escapeHtml(step.error)}</pre>
            </div>
            ` : ""}
            ${step.tags && step.tags.length > 0 ? `
            <div class="step-tags">
              ${step.tags.map(tag => `<span class="tag-badge">${this.escapeHtml(tag)}</span>`).join("")}
            </div>
            ` : ""}
          </div>
        `;
      })
      .join("");

    // Datos para gráficos
    const chartData = {
      pie: {
        labels: ["Passing", "Pending", "Ignored", "Skipped", "Aborted", "Failed", "Broken", "Compromised"],
        data: [
          report.summary.passedSteps,
          report.summary.pendingSteps,
          0, // Ignored
          report.summary.skippedSteps,
          report.summary.abortedSteps,
          report.summary.failedSteps,
          report.summary.brokenSteps,
          report.summary.compromisedSteps,
        ],
        colors: [
          "rgba(153,204,51,0.8)",   // Passing - verde
          "rgba(165, 199, 238, 0.8)", // Pending - azul claro
          "rgba(168, 168, 168, 0.8)", // Ignored - gris
          "rgba(238, 224, 152, 0.8)", // Skipped - amarillo
          "rgba(255, 153, 102, 0.8)", // Aborted - naranja
          "rgba(255, 22, 49, 0.8)",   // Failed - rojo
          "rgba(255, 97, 8, 0.8)",    // Broken - rojo oscuro
          "rgba(255, 104, 255, 0.8)", // Compromised - magenta
        ],
      },
      severity: {
        labels: ["Passing", "Pending", "Ignored", "Skipped", "Aborted", "Failed", "Broken", "Compromised"],
        automated: [
          report.summary.passedSteps,
          report.summary.pendingSteps,
          0,
          report.summary.skippedSteps,
          report.summary.abortedSteps,
          report.summary.failedSteps,
          report.summary.brokenSteps,
          report.summary.compromisedSteps,
        ],
      },
      duration: {
        labels: Object.keys(durationRanges),
        data: Object.values(durationRanges),
      },
      bar: {
        labels: report.steps.map((s) => `Step ${s.stepNumber}`),
        durations: report.steps.map((s) => (s.duration || 0) / 1000),
      },
    };

    return this.generateTailwindHtml(report, {
      formatDuration,
      formatTime,
      formatTimeShort,
      statusColor,
      statusBg,
      statusText,
      chartData,
      fastestStep,
      slowestStep,
      avgDuration,
      durationRanges,
    });
  }

  private getStatusColor(status: TestStep["status"]): { bg: string; color: string } {
    const colors: Record<string, { bg: string; color: string }> = {
      PASSED: { bg: "#d4edda", color: "#28a745" },
      FAILED: { bg: "#f8d7da", color: "#dc3545" },
      SKIPPED: { bg: "#fff3cd", color: "#ffc107" },
      PENDING: { bg: "#d1ecf1", color: "#17a2b8" },
      ABORTED: { bg: "#ffeaa7", color: "#f39c12" },
      BROKEN: { bg: "#fadbd8", color: "#e74c3c" },
      COMPROMISED: { bg: "#f8d7da", color: "#e91e63" },
    };
    return colors[status] || colors.PASSED;
  }

  private getStatusIcon(status: TestStep["status"]): string {
    const icons: Record<string, string> = {
      PASSED: "✓",
      FAILED: "✗",
      SKIPPED: "⊘",
      PENDING: "⏳",
      ABORTED: "⚠",
      BROKEN: "💥",
      COMPROMISED: "⚠",
    };
    return icons[status] || "?";
  }

  private generateSerenityStyleHtml(
    report: TestReport,
    helpers: any
  ): string {
    const {
      formatDuration,
      formatTime,
      formatTimeShort,
      statusColor,
      statusBg,
      statusText,
      stepsTableRows,
      stepsHtml,
      chartData,
      fastestStep,
      slowestStep,
      avgDuration,
      durationRanges,
    } = helpers;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Report: ${report.testName}</title>
  
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  
  <!-- DataTables -->
  <link rel="stylesheet" href="https://cdn.datatables.net/1.13.7/css/jquery.dataTables.min.css">
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>
  
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --primary-color: #0d7377;
      --primary-dark: #0a5d61;
      --secondary-color: #14a085;
      --success-color: #99cc33;
      --error-color: #ff1631;
      --warning-color: #eee098;
      --pending-color: #a5c7ee;
      --aborted-color: #ff9966;
      --broken-color: #ff6108;
      --compromised-color: #ff68ff;
      --bg-color: #f8f9fa;
      --sidebar-bg: #ffffff;
      --header-bg: #ffffff;
      --border-color: #e0e0e0;
      --text-primary: #212529;
      --text-secondary: #6c757d;
      --shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg-color);
      color: var(--text-primary);
      line-height: 1.6;
    }
    
    #topheader {
      background: var(--header-bg);
      border-bottom: 2px solid var(--primary-color);
      padding: 15px 30px;
      box-shadow: var(--shadow);
    }
    
    #topbanner {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    #logo {
      font-size: 24px;
      font-weight: bold;
      color: var(--primary-color);
    }
    
    .projectname {
      text-align: right;
    }
    
    .projecttitle {
      display: block;
      font-size: 20px;
      font-weight: bold;
      color: var(--text-primary);
    }
    
    .projectsubtitle {
      display: block;
      font-size: 14px;
      color: var(--text-secondary);
    }
    
    .middlecontent {
      padding: 20px 30px;
    }
    
    .nav-tabs {
      border-bottom: 2px solid var(--border-color);
      margin-bottom: 20px;
      display: flex;
      gap: 0;
      list-style: none;
    }
    
    .nav-tabs li {
      margin-right: 0;
    }
    
    .nav-tabs li a {
      display: block;
      padding: 12px 20px;
      color: var(--text-secondary);
      text-decoration: none;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
    }
    
    .nav-tabs li.active a {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
      font-weight: 600;
    }
    
    .nav-tabs li a:hover {
      color: var(--primary-color);
      background: var(--bg-color);
    }
    
    .date-and-time {
      float: right;
      color: var(--text-secondary);
      font-size: 14px;
      margin-top: -35px;
    }
    
    .test-count-summary {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: var(--shadow);
      margin-bottom: 20px;
    }
    
    .test-count-title {
      font-size: 24px;
      font-weight: bold;
      color: var(--text-primary);
    }
    
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: var(--shadow);
      margin-bottom: 20px;
    }
    
    .card-body {
      padding: 20px;
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
    }
    
    .dashboard-charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .chart-container {
      position: relative;
      height: 250px;
    }
    
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .table th,
    .table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    
    .table th {
      background: var(--bg-color);
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .table-striped tbody tr:nth-child(odd) {
      background: var(--bg-color);
    }
    
    .table-hover tbody tr:hover {
      background: #f0f0f0;
    }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
    }
    
    .progress {
      height: 20px;
      background: var(--bg-color);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
    }
    
    .progress-bar {
      height: 100%;
      transition: width 0.3s;
    }
    
    .step-item {
      background: white;
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 10px;
      border-radius: 6px;
      box-shadow: var(--shadow);
    }
    
    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .step-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }
    
    .step-status {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    
    .step-name {
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .step-meta {
      display: flex;
      gap: 16px;
      align-items: center;
      font-size: 13px;
      color: var(--text-secondary);
    }
    
    .step-screenshot {
      margin-top: 15px;
      border-radius: 6px;
      overflow: hidden;
      cursor: pointer;
      max-width: 600px;
    }
    
    .step-screenshot img {
      width: 100%;
      height: auto;
      display: block;
    }
    
    .step-error {
      margin-top: 15px;
      padding: 15px;
      background: #fff5f5;
      border-left: 4px solid var(--error-color);
      border-radius: 4px;
    }
    
    .step-error pre {
      margin-top: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .step-tags {
      margin-top: 10px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .tag-badge {
      padding: 4px 10px;
      background: var(--bg-color);
      border-radius: 12px;
      font-size: 11px;
      color: var(--text-secondary);
    }
    
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      justify-content: center;
      align-items: center;
    }
    
    .modal.active {
      display: flex;
    }
    
    .modal-content {
      max-width: 90%;
      max-height: 90%;
      position: relative;
    }
    
    .modal-content img {
      width: 100%;
      height: auto;
      display: block;
    }
    
    .close-modal {
      position: absolute;
      top: -40px;
      right: 0;
      color: white;
      font-size: 40px;
      font-weight: bold;
      cursor: pointer;
    }
    
    .error-text {
      color: var(--error-color);
      font-size: 12px;
    }
    
    .clr {
      clear: both;
    }
  </style>
</head>
<body class="results-page">
  <div id="topheader">
    <div id="topbanner">
      <div id="logo">🤖 Test Automation Report</div>
      <div class="projectname">
        <span class="projecttitle">${report.testName}</span>
        <span class="projectsubtitle">Reporte de Ejecución de Pruebas</span>
      </div>
    </div>
  </div>

  <div class="middlecontent">
    <div>
      <ul class="nav nav-tabs" role="tablist">
        <li class="active">
          <a href="#" onclick="showTab('summary'); return false;"><i class="bi bi-journal-check"></i> Overall Test Results</a>
        </li>
        <li>
          <a href="#" onclick="showTab('tests'); return false;"><i class="bi bi-speedometer"></i> Test Results</a>
        </li>
        <li>
          <a href="#" onclick="showTab('steps'); return false;"><i class="bi bi-list-check"></i> Steps Details</a>
        </li>
        <li>
          <a href="#" onclick="showTab('success-logs'); return false;"><i class="bi bi-check-circle"></i> Success Logs</a>
        </li>
        <li>
          <a href="#" onclick="showTab('error-logs'); return false;"><i class="bi bi-x-circle"></i> Error Logs</a>
        </li>
      </ul>
      <span class="date-and-time">
        <i class="bi bi-info-circle"></i> Report generated ${formatTime(report.endTime)}
      </span>
      <br style="clear:left"/>
    </div>

    <div id="summary" class="tab-content active">
      <div class="test-count-summary">
        <div class="test-count-title">
          ${report.summary.totalSteps} test steps
          <span style="color: ${statusColor}; font-size: 18px;">${statusText}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <ul class="nav nav-tabs" style="border-bottom: 1px solid var(--border-color); margin-bottom: 20px;">
            <li class="active"><a href="#" onclick="showSubTab('summary-overview'); return false;">Summary</a></li>
            <li><a href="#" onclick="showSubTab('summary-tests'); return false;">Test Results</a></li>
          </ul>

          <div id="summary-overview" class="sub-tab-content active">
            <div class="dashboard-charts">
              <div>
                <h4><i class="bi bi-pie-chart"></i> Overview</h4>
                <div class="chart-container">
                  <canvas id="resultChart"></canvas>
                </div>
              </div>
              <div>
                <h4><i class="bi bi-check-square"></i> Test Outcomes</h4>
                <div class="chart-container">
                  <canvas id="severityChart"></canvas>
                </div>
              </div>
              <div>
                <h4><i class="bi bi-graph-up"></i> Test Performance</h4>
                <div class="chart-container">
                  <canvas id="durationChart"></canvas>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <h3><i class="bi bi-speedometer2"></i> Key Statistics</h3>
                <table class="table table-striped table-hover">
                  <tbody>
                    <tr>
                      <td><i class="bi bi-card-checklist"></i> Total Number of Test Steps</td>
                      <td><strong>${report.summary.totalSteps}</strong></td>
                    </tr>
                    <tr>
                      <td><i class="bi bi-flag-fill"></i> Tests Started</td>
                      <td><strong>${formatTime(report.startTime)}</strong></td>
                    </tr>
                    <tr>
                      <td><i class="bi bi-stop-circle"></i> Tests Finished</td>
                      <td><strong>${formatTime(report.endTime)}</strong></td>
                    </tr>
                    <tr>
                      <td><i class="bi bi-stopwatch"></i> Total Duration</td>
                      <td><strong>${formatDuration(report.duration)}</strong></td>
                    </tr>
                    <tr>
                      <td><i class="bi bi-trophy"></i> Fastest Step</td>
                      <td><strong>${formatDuration(fastestStep)}</strong></td>
                    </tr>
                    <tr>
                      <td><i class="bi bi-skip-start"></i> Slowest Step</td>
                      <td><strong>${formatDuration(slowestStep)}</strong></td>
                    </tr>
                    <tr>
                      <td><i class="bi bi-stopwatch"></i> Average Execution Time</td>
                      <td><strong>${formatDuration(avgDuration)}</strong></td>
                    </tr>
                    <tr>
                      <td><i class="bi bi-percent"></i> Success Rate</td>
                      <td><strong style="color: ${report.summary.successRate >= 80 ? 'var(--success-color)' : 'var(--error-color)'};">${report.summary.successRate}%</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            ${report.tags && report.tags.length > 0 ? `
            <div class="card">
              <div class="card-body">
                <h3>Tags</h3>
                <div style="margin-top: 15px;">
                  ${report.tags.map(tag => `
                    <span class="tag-badge" style="background-color: var(--primary-color); color: white; margin: 5px; padding: 6px 12px;">
                      <i class="bi bi-tag-fill"></i> ${this.escapeHtml(tag)}
                    </span>
                  `).join("")}
                </div>
              </div>
            </div>
            ` : ""}
          </div>

          <div id="summary-tests" class="sub-tab-content">
            <h3><i class="bi bi-gear"></i> Automated Steps</h3>
            <table id="steps-table" class="table table-striped table-hover" style="width:100%">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Time</th>
                  <th>Screenshot</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                ${stepsTableRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div id="tests" class="tab-content">
      <div class="card">
        <div class="card-body">
          <h3><i class="bi bi-speedometer2"></i> Key Statistics</h3>
          <table class="table table-striped table-hover">
            <tbody>
              <tr>
                <td><i class="bi bi-card-checklist"></i> Total Number of Test Steps</td>
                <td><strong>${report.summary.totalSteps}</strong></td>
                <td><i class="bi bi-stopwatch"></i> Total Duration</td>
                <td><strong>${formatDuration(report.duration)}</strong></td>
              </tr>
              <tr>
                <td><i class="bi bi-trophy"></i> Fastest Step</td>
                <td><strong>${formatDuration(fastestStep)}</strong></td>
                <td><i class="bi bi-skip-start"></i> Slowest Step</td>
                <td><strong>${formatDuration(slowestStep)}</strong></td>
              </tr>
              <tr>
                <td><i class="bi bi-stopwatch"></i> Average Execution Time</td>
                <td><strong>${formatDuration(avgDuration)}</strong></td>
                <td><i class="bi bi-percent"></i> Success Rate</td>
                <td><strong style="color: ${report.summary.successRate >= 80 ? 'var(--success-color)' : 'var(--error-color)'};">${report.summary.successRate}%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="steps" class="tab-content">
      <div class="card">
        <div class="card-body">
          <h3><i class="bi bi-list-check"></i> Steps Details</h3>
          <div id="steps-container">
            ${stepsHtml}
          </div>
        </div>
      </div>
    </div>

    <div id="success-logs" class="tab-content">
      <div class="card">
        <div class="card-body">
          <h3><i class="bi bi-check-circle"></i> Success Logs</h3>
          <p>Total de logs exitosos: <strong>${this.successLogs.length}</strong></p>
          <table id="success-logs-table" class="table table-striped table-hover" style="width:100%">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Elemento</th>
                <th>Acción</th>
                <th>Mensaje</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              ${this.successLogs.map((log: ActionLog) => `
                <tr>
                  <td>${formatTimeShort(log.timestamp)}</td>
                  <td>${log.element || '-'}</td>
                  <td>${log.action || '-'}</td>
                  <td>${this.escapeHtml(log.message)}</td>
                  <td>${log.details ? this.escapeHtml(log.details) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="error-logs" class="tab-content">
      <div class="card">
        <div class="card-body">
          <h3><i class="bi bi-x-circle"></i> Error Logs</h3>
          <p>Total de errores: <strong>${this.errorLogs.length}</strong></p>
          ${this.errorLogs.length > 0 ? `
          <table id="error-logs-table" class="table table-striped table-hover" style="width:100%">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Elemento</th>
                <th>Acción</th>
                <th>Mensaje</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              ${this.errorLogs.map((log: ActionLog) => `
                <tr style="background-color: #fff5f5;">
                  <td>${formatTimeShort(log.timestamp)}</td>
                  <td>${log.element || '-'}</td>
                  <td>${log.action || '-'}</td>
                  <td><span style="color: var(--error-color);">${this.escapeHtml(log.message)}</span></td>
                  <td>${log.details ? this.escapeHtml(log.details) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : '<p style="color: var(--success-color);">✅ No se registraron errores durante la ejecución.</p>'}
        </div>
      </div>
    </div>
  </div>

  <div id="screenshotModal" class="modal" onclick="closeScreenshotModal()">
    <span class="close-modal">&times;</span>
    <div class="modal-content">
      <img id="modalImage" src="" alt="Screenshot" />
    </div>
  </div>

  <script>
    const reportData = ${JSON.stringify({
      steps: report.steps,
      summary: report.summary,
      chartData: chartData
    })};

    function showTab(tabName) {
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.querySelectorAll('.nav-tabs li').forEach(item => item.classList.remove('active'));
      document.getElementById(tabName).classList.add('active');
      event.target.closest('li').classList.add('active');
      
      if (tabName === 'summary' || tabName === 'summary-tests') {
        setTimeout(() => {
          if (document.getElementById('steps-table')) {
            $('#steps-table').DataTable({
              order: [[0, 'asc']],
              pageLength: 10,
              lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
              language: {
                searchPlaceholder: "Filter",
                search: ""
              }
            });
          }
        }, 100);
      }
      
      if (tabName === 'success-logs') {
        setTimeout(() => {
          if (document.getElementById('success-logs-table')) {
            $('#success-logs-table').DataTable({
              order: [[0, 'desc']],
              pageLength: 25,
              lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
              language: {
                searchPlaceholder: "Filter",
                search: ""
              }
            });
          }
        }, 100);
      }
      
      if (tabName === 'error-logs') {
        setTimeout(() => {
          if (document.getElementById('error-logs-table')) {
            $('#error-logs-table').DataTable({
              order: [[0, 'desc']],
              pageLength: 25,
              lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
              language: {
                searchPlaceholder: "Filter",
                search: ""
              }
            });
          }
        }, 100);
      }
      
      if (tabName === 'summary') {
        setTimeout(renderCharts, 100);
      }
    }

    function showSubTab(tabName) {
      document.querySelectorAll('.sub-tab-content').forEach(content => content.classList.remove('active'));
      document.querySelectorAll('.card .nav-tabs li').forEach(item => item.classList.remove('active'));
      document.getElementById(tabName).classList.add('active');
      event.target.closest('li').classList.add('active');
      
      if (tabName === 'summary-tests') {
        setTimeout(() => {
          if (document.getElementById('steps-table')) {
            $('#steps-table').DataTable({
              order: [[0, 'asc']],
              pageLength: 10,
              lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
              language: {
                searchPlaceholder: "Filter",
                search: ""
              }
            });
          }
        }, 100);
      }
    }

    function openScreenshotModal(imagePath) {
      document.getElementById('modalImage').src = imagePath;
      document.getElementById('screenshotModal').classList.add('active');
    }

    function closeScreenshotModal() {
      document.getElementById('screenshotModal').classList.remove('active');
    }

    function renderCharts() {
      // Pie Chart - Overview
      const pieCtx = document.getElementById('resultChart');
      if (pieCtx && !pieCtx.chart) {
        const pieData = {
          labels: ${JSON.stringify(chartData.pie.labels)},
          datasets: [{
            data: ${JSON.stringify(chartData.pie.data)},
            backgroundColor: ${JSON.stringify(chartData.pie.colors)},
            borderWidth: 1
          }]
        };
        
        pieCtx.chart = new Chart(pieCtx, {
          type: 'doughnut',
          data: pieData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' },
              datalabels: {
                color: '#444444',
                font: { weight: 'bold' },
                formatter: (value, ctx) => {
                  let sum = 0;
                  let dataArr = ctx.chart.data.datasets[0].data;
                  dataArr.map(data => { sum += data; });
                  let percentage = (value * 100 / sum).toFixed(0) + "%";
                  return percentage === '0%' || percentage === 'NaN%' ? '' : percentage;
                }
              }
            }
          },
          plugins: [ChartDataLabels]
        });
      }

      // Bar Chart - Severity
      const severityCtx = document.getElementById('severityChart');
      if (severityCtx && !severityCtx.chart) {
        severityCtx.chart = new Chart(severityCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(chartData.severity.labels)},
            datasets: [{
              label: 'Automated',
              data: ${JSON.stringify(chartData.severity.automated)},
              backgroundColor: ${JSON.stringify(chartData.pie.colors)},
              borderColor: ${JSON.stringify(chartData.pie.colors.map((c: string) => c.replace('0.8', '1')))},
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true },
              y: { stacked: true, beginAtZero: true }
            },
            plugins: {
              legend: { display: false },
              datalabels: {
                color: '#444444',
                font: { weight: 'bold' },
                formatter: (value) => value > 0 ? value : ''
              }
            }
          },
          plugins: [ChartDataLabels]
        });
      }

      // Bar Chart - Duration
      const durationCtx = document.getElementById('durationChart');
      if (durationCtx && !durationCtx.chart) {
        durationCtx.chart = new Chart(durationCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(chartData.duration.labels)},
            datasets: [{
              label: 'Number of steps per duration',
              data: ${JSON.stringify(chartData.duration.data)},
              backgroundColor: 'rgba(83, 146, 255, 0.5)',
              borderColor: 'rgba(83, 146, 255, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true }
            },
            plugins: {
              legend: { display: false },
              datalabels: {
                color: '#444444',
                font: { weight: 'bold' },
                formatter: (value) => value > 0 ? value : ''
              }
            }
          },
          plugins: [ChartDataLabels]
        });
      }
    }

    // Initialize charts on page load
    setTimeout(renderCharts, 500);
  </script>
</body>
</html>`;
  }

  private generateTailwindHtml(
    report: TestReport,
    helpers: any
  ): string {
    const {
      formatDuration,
      formatTime,
      formatTimeShort,
      statusColor,
      statusBg,
      statusText,
      chartData,
      fastestStep,
      slowestStep,
      avgDuration,
      durationRanges,
    } = helpers;

    // Generar HTML de escenarios con acordeones para Steps Details
    const scenariosHtml = this.generateScenariosHtml(report, formatDuration, formatTimeShort);
    
    // Generar HTML de test cases para la pestaña Test Results
    const testCasesHtml = this.generateTestCasesHtml(report, formatDuration, formatTimeShort);
    
    // Generar HTML de Success Logs (sin DataTables)
    const successLogsHtml = this.generateLogsHtml(report, true, formatTimeShort);
    
    // Generar HTML de Error Logs (sin DataTables)
    const errorLogsHtml = this.generateLogsHtml(report, false, formatTimeShort);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Report: ${report.testName}</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
  
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#0d7377',
            secondary: '#14a085',
          }
        }
      }
    }
  </script>
  
  <style>
    [x-cloak] { display: none !important; }
  </style>
</head>
<body class="bg-gray-50">
  <!-- Header -->
  <header class="bg-white border-b-2 border-primary shadow-sm">
    <div class="container mx-auto px-6 py-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <div class="text-2xl font-bold text-primary">🤖 Test Automation Report</div>
        </div>
        <div class="text-right">
          <div class="text-xl font-bold text-gray-800">${report.testName}</div>
          <div class="text-sm text-gray-600">Reporte de Ejecución de Pruebas</div>
        </div>
      </div>
    </div>
  </header>

  <!-- Navigation Tabs -->
  <div class="bg-white border-b border-gray-200 shadow-sm">
    <div class="container mx-auto px-6">
      <div class="flex items-center justify-between">
        <nav class="flex space-x-1" role="tablist">
          <button onclick="showTab('summary')" class="tab-button active px-6 py-3 text-sm font-medium text-gray-700 border-b-2 border-primary" id="tab-summary">
            <i class="bi bi-journal-check"></i> Overall Test Results
          </button>
          <button onclick="showTab('test-results')" class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700" id="tab-test-results">
            <i class="bi bi-speedometer"></i> Test Results
          </button>
          <button onclick="showTab('steps-details')" class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700" id="tab-steps-details">
            <i class="bi bi-list-check"></i> Steps Details
          </button>
          <button onclick="showTab('success-logs')" class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700" id="tab-success-logs">
            <i class="bi bi-check-circle"></i> Success Logs
          </button>
          <button onclick="showTab('error-logs')" class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700" id="tab-error-logs">
            <i class="bi bi-x-circle"></i> Error Logs
          </button>
          <button onclick="showTab('video')" class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700" id="tab-video">
            <i class="bi bi-camera-video"></i> Video
          </button>
        </nav>
        <div class="text-sm text-gray-500">
          <i class="bi bi-info-circle"></i> Report generated ${formatTime(report.endTime)}
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <main class="container mx-auto px-6 py-8">
    <!-- Tab: Overall Test Results - Summary -->
    <div id="summary" class="tab-content">
      ${this.generateSummaryTab(report, formatDuration, formatTime, formatTimeShort, chartData, fastestStep, slowestStep, avgDuration, durationRanges, statusText)}
    </div>

    <!-- Tab: Overall Test Results - Test Results -->
    <div id="test-results" class="tab-content hidden">
      ${this.generateTestResultsTab(report, formatDuration, formatTime, fastestStep, slowestStep, avgDuration, testCasesHtml)}
    </div>

    <!-- Tab: Steps Details -->
    <div id="steps-details" class="tab-content hidden">
      ${scenariosHtml}
    </div>

    <!-- Tab: Success Logs -->
    <div id="success-logs" class="tab-content hidden">
      ${successLogsHtml}
    </div>

    <!-- Tab: Error Logs -->
    <div id="error-logs" class="tab-content hidden">
      ${errorLogsHtml}
    </div>

    <!-- Tab: Video -->
    <div id="video" class="tab-content hidden">
      ${this.generateVideoTab()}
    </div>
  </main>

  <!-- Screenshot Modal -->
  <div id="screenshotModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center" onclick="closeScreenshotModal()">
    <span class="absolute top-4 right-4 text-white text-4xl font-bold cursor-pointer">&times;</span>
    <div class="max-w-5xl max-h-full p-4">
      <img id="modalImage" src="" alt="Screenshot" class="max-w-full max-h-screen" />
    </div>
  </div>

  <script>
    const reportData = ${JSON.stringify({
      steps: report.steps,
      summary: report.summary,
      chartData: chartData,
      scenarios: report.scenarios,
      testCases: report.testCases,
      features: report.features
    })};

    function showTab(tabName) {
      // Asegurar que el scroll no esté bloqueado
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Ocultar todos los tabs
      document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'border-primary', 'text-gray-700');
        btn.classList.add('text-gray-500');
      });
      
      // Mostrar tab seleccionado
      document.getElementById(tabName).classList.remove('hidden');
      const button = document.getElementById('tab-' + tabName);
      if (button) {
        button.classList.add('active', 'border-b-2', 'border-primary', 'text-gray-700');
        button.classList.remove('text-gray-500');
      }
      
      // Renderizar gráficos si es necesario
      if (tabName === 'summary') {
        setTimeout(renderCharts, 100);
      }
      
      // Scroll al inicio del contenido después de cambiar de tab
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }

    function showSubTab(tabName) {
      document.querySelectorAll('.sub-tab-content').forEach(content => content.classList.add('hidden'));
      document.querySelectorAll('.sub-tab-button').forEach(btn => {
        btn.classList.remove('active', 'border-primary', 'text-gray-700');
        btn.classList.add('text-gray-500');
      });
      
      document.getElementById(tabName).classList.remove('hidden');
      const button = document.getElementById('sub-tab-' + tabName.split('-').pop());
      if (button) {
        button.classList.add('active', 'border-b-2', 'border-primary', 'text-gray-700');
        button.classList.remove('text-gray-500');
      }
      
      if (tabName === 'summary-overview') {
        setTimeout(renderCharts, 100);
      }
    }

    function openScreenshotModal(imagePath) {
      document.getElementById('modalImage').src = imagePath;
      document.getElementById('screenshotModal').classList.remove('hidden');
    }

    function closeScreenshotModal() {
      document.getElementById('screenshotModal').classList.add('hidden');
    }

    function toggleAccordion(id) {
      const content = document.getElementById('accordion-' + id);
      const icon = document.getElementById('accordion-icon-' + id);
      if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        if (icon) icon.classList.remove('bi-chevron-down');
        if (icon) icon.classList.add('bi-chevron-up');
      } else {
        content.classList.add('hidden');
        if (icon) icon.classList.remove('bi-chevron-up');
        if (icon) icon.classList.add('bi-chevron-down');
      }
    }

    function scrollToFeature(featureId) {
      const element = document.getElementById(featureId);
      if (element) {
        // Usar scrollTo en lugar de scrollIntoView para evitar problemas de scroll bloqueado
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - 100; // Offset para dejar espacio arriba
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Asegurar que el scroll no esté bloqueado después de navegar
        setTimeout(() => {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        }, 500);
      }
    }

    function renderCharts() {
      // Pie Chart - Overview
      const pieCtx = document.getElementById('resultChart');
      if (pieCtx && !pieCtx.chart) {
        pieCtx.chart = new Chart(pieCtx, {
          type: 'doughnut',
          data: {
            labels: ${JSON.stringify(chartData.pie.labels)},
            datasets: [{
              data: ${JSON.stringify(chartData.pie.data)},
              backgroundColor: ${JSON.stringify(chartData.pie.colors)},
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              datalabels: {
                color: '#444444',
                font: { weight: 'bold' },
                formatter: (value, ctx) => {
                  let sum = 0;
                  ctx.chart.data.datasets[0].data.forEach((d) => sum += d);
                  let percentage = (value * 100 / sum).toFixed(0) + "%";
                  return percentage === '0%' || percentage === 'NaN%' ? '' : percentage;
                }
              }
            }
          },
          plugins: [ChartDataLabels]
        });
      }

      // Bar Chart - Severity
      const severityCtx = document.getElementById('severityChart');
      if (severityCtx && !severityCtx.chart) {
        severityCtx.chart = new Chart(severityCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(chartData.severity.labels)},
            datasets: [{
              label: 'Automated',
              data: ${JSON.stringify(chartData.severity.automated)},
              backgroundColor: ${JSON.stringify(chartData.pie.colors)},
              borderColor: ${JSON.stringify(chartData.pie.colors.map((c: string) => c.replace('0.8', '1')))},
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              x: { stacked: true },
              y: { stacked: true, beginAtZero: true }
            },
            plugins: {
              legend: { display: false },
              datalabels: {
                color: '#444444',
                font: { weight: 'bold' },
                formatter: (value) => value > 0 ? value : ''
              }
            }
          },
          plugins: [ChartDataLabels]
        });
      }

      // Bar Chart - Duration
      const durationCtx = document.getElementById('durationChart');
      if (durationCtx && !durationCtx.chart) {
        durationCtx.chart = new Chart(durationCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(chartData.duration.labels)},
            datasets: [{
              label: 'Number of steps per duration',
              data: ${JSON.stringify(chartData.duration.data)},
              backgroundColor: 'rgba(83, 146, 255, 0.5)',
              borderColor: 'rgba(83, 146, 255, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true }
            },
            plugins: {
              legend: { display: false },
              datalabels: {
                color: '#444444',
                font: { weight: 'bold' },
                formatter: (value) => value > 0 ? value : ''
              }
            }
          },
          plugins: [ChartDataLabels]
        });
      }

      // Coverage Chart
      const coverageCtx = document.getElementById('coverageChart');
      if (coverageCtx && reportData.features && reportData.features.length > 0) {
        const features = reportData.features;
        coverageCtx.chart = new Chart(coverageCtx, {
          type: 'bar',
          data: {
            labels: features.map((f) => f.name),
            datasets: [
              { label: 'Passing', data: features.map((f) => f.passedTestCases), backgroundColor: 'rgba(153,204,51,0.5)' },
              { label: 'Failed', data: features.map((f) => f.failedTestCases), backgroundColor: 'rgba(255, 22, 49, 0.5)' },
            ]
          },
          options: {
            responsive: true,
            indexAxis: 'y',
            scales: {
              x: { stacked: true },
              y: { stacked: true }
            },
            plugins: {
              legend: { position: 'bottom' },
              datalabels: {
                color: '#444444',
                font: { weight: 'bold' }
              }
            }
          },
          plugins: [ChartDataLabels]
        });
      }
    }

    // Initialize charts on page load
    setTimeout(renderCharts, 500);
  </script>
</body>
</html>`;
  }

  private generateSummaryTab(
    report: TestReport,
    formatDuration: (ms: number) => string,
    formatTime: (iso: string) => string,
    formatTimeShort: (iso: string) => string,
    chartData: any,
    fastestStep: number,
    slowestStep: number,
    avgDuration: number,
    durationRanges: Record<string, number>,
    statusText: string
  ): string {
    return `
      <!-- Test Count Summary -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="text-3xl font-bold text-gray-800">
          ${report.summary.totalSteps} test steps
          <span class="text-xl ${report.status === 'PASSED' ? 'text-green-600' : 'text-red-600'}">${statusText}</span>
        </div>
      </div>

      <!-- Sub-tabs -->
      <div class="bg-white rounded-lg shadow-md mb-6">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            <button onclick="showSubTab('summary-overview')" class="sub-tab-button active px-6 py-3 text-sm font-medium text-gray-700 border-b-2 border-primary" id="sub-tab-overview">
              Summary
            </button>
            <button onclick="showSubTab('summary-test-results')" class="sub-tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700" id="sub-tab-test-results">
              Test Results
            </button>
          </nav>
        </div>

        <!-- Sub-tab: Summary Overview -->
        <div id="summary-overview" class="sub-tab-content p-6">
          <!-- Charts Row -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Pie Chart -->
            <div class="bg-white rounded-lg shadow p-4">
              <h4 class="text-lg font-semibold mb-4 flex items-center">
                <i class="bi bi-pie-chart mr-2"></i> Overview
              </h4>
              <div class="h-64">
                <canvas id="resultChart"></canvas>
              </div>
            </div>

            <!-- Severity Chart -->
            <div class="bg-white rounded-lg shadow p-4">
              <h4 class="text-lg font-semibold mb-4 flex items-center">
                <i class="bi bi-check-square mr-2"></i> Test Outcomes
              </h4>
              <div class="h-64">
                <canvas id="severityChart"></canvas>
              </div>
            </div>

            <!-- Duration Chart -->
            <div class="bg-white rounded-lg shadow p-4">
              <h4 class="text-lg font-semibold mb-4 flex items-center">
                <i class="bi bi-graph-up mr-2"></i> Test Performance
              </h4>
              <div class="h-64">
                <canvas id="durationChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Functional Coverage Overview & Key Statistics -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <!-- Functional Coverage Overview -->
            <div class="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h3 class="text-xl font-semibold mb-4 flex items-center">
                <i class="bi bi-reception-3 mr-2"></i> Functional Coverage Overview
              </h3>
              <h4 class="text-lg font-medium mb-4">Features</h4>
              <div class="h-64">
                <canvas id="coverageChart"></canvas>
              </div>
            </div>

            <!-- Key Statistics -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-xl font-semibold mb-4 flex items-center">
                <i class="bi bi-speedometer2 mr-2"></i> Key Statistics
              </h3>
              <div class="space-y-3">
                <div class="flex justify-between py-2 border-b">
                  <span class="flex items-center text-gray-700">
                    <i class="bi bi-card-checklist mr-2"></i> Number of Scenarios
                  </span>
                  <span class="font-semibold">${report.summary.totalScenarios || 0}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="flex items-center text-gray-700">
                    <i class="bi bi-caret-right mr-2"></i> Total Number of Test Cases
                  </span>
                  <span class="font-semibold">${report.summary.totalTestCases || 0}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="flex items-center text-gray-700">
                    <i class="bi bi-flag-fill mr-2"></i> Tests Started
                  </span>
                  <span class="font-semibold">${formatTime(report.startTime)}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="flex items-center text-gray-700">
                    <i class="bi bi-stop-circle mr-2"></i> Tests Finished
                  </span>
                  <span class="font-semibold">${formatTime(report.endTime)}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="flex items-center text-gray-700">
                    <i class="bi bi-stopwatch mr-2"></i> Total Duration
                  </span>
                  <span class="font-semibold">${formatDuration(report.duration)}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="flex items-center text-gray-700">
                    <i class="bi bi-trophy mr-2"></i> Fastest Test
                  </span>
                  <span class="font-semibold">${formatDuration(fastestStep)}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="flex items-center text-gray-700">
                    <i class="bi bi-skip-start mr-2"></i> Slowest Test
                  </span>
                  <span class="font-semibold">${formatDuration(slowestStep)}</span>
                </div>
                <div class="flex justify-between py-2 border-b">
                  <span class="flex items-center text-gray-700">
                    <i class="bi bi-stopwatch mr-2"></i> Average Execution Time
                  </span>
                  <span class="font-semibold">${formatDuration(avgDuration)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Functional Coverage Details -->
          ${this.generateFunctionalCoverageDetails(report)}

          <!-- Test Failure Overview -->
          ${this.generateTestFailureOverview(report)}

          <!-- Tags -->
          ${report.tags && report.tags.length > 0 ? this.generateTagsSection(report.tags) : ''}
          
          <!-- Video Recording -->
          ${this.videoPath && fs.existsSync(this.videoPath) ? this.generateVideoSection() : ''}
        </div>

        <!-- Sub-tab: Test Results -->
        <div id="summary-test-results" class="sub-tab-content hidden p-6">
          ${this.generateTestResultsContent(report, formatDuration, formatTimeShort)}
        </div>
      </div>
    `;
  }

  private generateFunctionalCoverageDetails(report: TestReport): string {
    if (!report.features || report.features.length === 0) {
      return '';
    }

    const featuresRows = report.features.map(feature => {
      const passRate = feature.totalTestCases > 0 
        ? Math.round((feature.passedTestCases / feature.totalTestCases) * 100) 
        : 0;
      const failRate = feature.totalTestCases > 0 
        ? Math.round((feature.failedTestCases / feature.totalTestCases) * 100) 
        : 0;
      const statusIcon = feature.failedTestCases > 0 
        ? '<i class="bi bi-x-circle-fill text-red-500"></i>' 
        : '<i class="bi bi-check-circle-fill text-green-500"></i>';

      // Generar ID único para el feature basado en su nombre
      const featureId = `feature-${feature.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
      
      return `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3">
            <a href="#steps-details" onclick="showTab('steps-details'); scrollToFeature('${featureId}'); return false;" class="text-blue-600 hover:underline">${this.escapeHtml(feature.name)}</a>
          </td>
          <td class="px-4 py-3 text-center">${feature.totalScenarios}</td>
          <td class="px-4 py-3 text-center">${feature.totalTestCases}</td>
          <td class="px-4 py-3 text-center font-semibold">${passRate}%</td>
          <td class="px-4 py-3 text-center">${statusIcon}</td>
          <td class="px-4 py-3">
            <div class="w-full bg-gray-200 rounded-full h-4 flex">
              <div class="bg-green-500 h-4 rounded-l-full" style="width: ${passRate}%"></div>
              <div class="bg-red-500 h-4 rounded-r-full" style="width: ${failRate}%"></div>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-xl font-semibold mb-4">Functional Coverage Details</h3>
        <div class="mb-4">
          <input type="text" id="featureFilter" placeholder="Filter features..." 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Scenarios</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Test Cases</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">% Pass</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200" id="featuresTableBody">
              ${featuresRows}
            </tbody>
          </table>
        </div>
      </div>
      <script>
        document.getElementById('featureFilter')?.addEventListener('input', function(e) {
          const filter = e.target.value.toLowerCase();
          const rows = document.querySelectorAll('#featuresTableBody tr');
          rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
          });
        });
      </script>
    `;
  }

  private generateTestFailureOverview(report: TestReport): string {
    if (!report.features || report.features.length === 0) {
      return '';
    }

    // Calcular features más inestables
    const unstableFeatures = report.features
      .filter(f => f.failedTestCases > 0)
      .map(f => ({
        name: f.name,
        failureRate: f.totalTestCases > 0 
          ? Math.round((f.failedTestCases / f.totalTestCases) * 100) 
          : 0
      }))
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 5);

    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-xl font-semibold mb-4">Test Failure Overview</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="text-lg font-medium mb-3">Most Frequent Failures</h4>
            <div class="text-gray-500 text-sm">No failures recorded</div>
          </div>
          <div>
            <h4 class="text-lg font-medium mb-3">Most Unstable Features</h4>
            ${unstableFeatures.length > 0 ? `
              <div class="space-y-2">
                ${unstableFeatures.map(f => {
                  const featureId = `feature-${f.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
                  return `
                  <div class="flex justify-between items-center p-2 bg-red-50 rounded">
                    <a href="#steps-details" onclick="showTab('steps-details'); scrollToFeature('${featureId}'); return false;" class="text-red-600 hover:underline">${this.escapeHtml(f.name)}</a>
                    <span class="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">${f.failureRate}%</span>
                  </div>
                `;
                }).join('')}
              </div>
            ` : '<div class="text-gray-500 text-sm">No unstable features</div>'}
          </div>
        </div>
      </div>
    `;
  }

  private generateTagsSection(tags: string[]): string {
    return `
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-xl font-semibold mb-4">Tags</h3>
        <div class="flex flex-wrap gap-2">
          ${tags.map(tag => `
            <span class="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              <i class="bi bi-tag-fill mr-2"></i> ${this.escapeHtml(tag)}
            </span>
          `).join('')}
        </div>
      </div>
    `;
  }

  private generateVideoSection(): string {
    if (!this.videoPath || !fs.existsSync(this.videoPath)) {
      return '';
    }
    
    const videoRelativePath = path.relative(this.currentReportDir, this.videoPath).replace(/\\/g, "/");
    
    return `
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-xl font-semibold mb-4 flex items-center">
          <i class="bi bi-camera-video mr-2"></i> Video Recording E2E
        </h3>
        <div class="mt-4">
          <video controls class="w-full max-w-4xl rounded-lg shadow-md" style="max-height: 600px;">
            <source src="${videoRelativePath}" type="video/webm">
            Tu navegador no soporta la reproducción de video.
          </video>
          <p class="text-sm text-gray-600 mt-2">
            <i class="bi bi-info-circle mr-1"></i> Video completo de la ejecución del test
          </p>
        </div>
      </div>
    `;
  }

  private generateVideoTab(): string {
    if (!this.videoPath || !fs.existsSync(this.videoPath)) {
      return `
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <i class="bi bi-camera-video mr-2"></i> Video Recording E2E
          </h3>
          <div class="text-center py-12">
            <i class="bi bi-camera-video-off text-6xl text-gray-400 mb-4"></i>
            <p class="text-gray-600 text-lg mb-2">No hay video disponible</p>
            <p class="text-gray-500 text-sm">La grabación de video no se generó durante la ejecución del test.</p>
            <p class="text-gray-500 text-sm mt-2">Esto puede deberse a que la grabación de video no está habilitada en la configuración del navegador.</p>
          </div>
        </div>
      `;
    }
    
    const videoRelativePath = path.relative(this.currentReportDir, this.videoPath).replace(/\\/g, "/");
    const videoStats = fs.statSync(this.videoPath);
    const videoSizeMB = (videoStats.size / (1024 * 1024)).toFixed(2);
    
    return `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-xl font-semibold mb-4 flex items-center">
          <i class="bi bi-camera-video mr-2"></i> Video Recording E2E
        </h3>
        <div class="mb-4 p-4 bg-blue-50 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-700">Archivo: <span class="font-mono">${path.basename(this.videoPath)}</span></p>
              <p class="text-sm text-gray-600 mt-1">Tamaño: ${videoSizeMB} MB</p>
            </div>
            <a href="${videoRelativePath}" download class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
              <i class="bi bi-download mr-2"></i> Descargar
            </a>
          </div>
        </div>
        <div class="mt-4">
          <video controls class="w-full rounded-lg shadow-md" style="max-height: 70vh;">
            <source src="${videoRelativePath}" type="video/webm">
            Tu navegador no soporta la reproducción de video.
          </video>
          <p class="text-sm text-gray-600 mt-3 flex items-center">
            <i class="bi bi-info-circle mr-2"></i> Video completo de la ejecución del test E2E
          </p>
        </div>
      </div>
    `;
  }

  private generateTestResultsTab(
    report: TestReport,
    formatDuration: (ms: number) => string,
    formatTime: (iso: string) => string,
    fastestStep: number,
    slowestStep: number,
    avgDuration: number,
    testCasesHtml: string
  ): string {
    return `
      <!-- Key Statistics -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 class="text-xl font-semibold mb-4 flex items-center">
          <i class="bi bi-speedometer2 mr-2"></i> Key Statistics
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600 mb-1">Number of Scenarios</div>
            <div class="text-2xl font-bold">${report.summary.totalScenarios || 0}</div>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600 mb-1">Total Number of Test Cases</div>
            <div class="text-2xl font-bold">${report.summary.totalTestCases || 0}</div>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600 mb-1">Total Duration</div>
            <div class="text-2xl font-bold">${formatDuration(report.duration)}</div>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600 mb-1">Success Rate</div>
            <div class="text-2xl font-bold ${report.summary.successRate >= 80 ? 'text-green-600' : 'text-red-600'}">${report.summary.successRate}%</div>
          </div>
        </div>
      </div>

      <!-- Automated Scenarios -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 class="text-xl font-semibold mb-4 flex items-center">
          <i class="bi bi-gear mr-2"></i> Automated Scenarios
        </h3>
        ${testCasesHtml}
      </div>

      <!-- Tags -->
      ${report.tags && report.tags.length > 0 ? this.generateTagsSection(report.tags) : ''}
    `;
  }

  private generateTestCasesHtml(report: TestReport, formatDuration: (ms: number) => string, formatTimeShort: (iso: string) => string): string {
    if (!report.testCases || report.testCases.length === 0) {
      return '<p class="text-gray-500">No test cases executed</p>';
    }

      const testCasesRows = report.testCases.map((testCase, index) => {
      const statusIcon = testCase.status === 'PASSED' 
        ? '<i class="bi bi-check-circle-fill text-green-500"></i>' 
        : '<i class="bi bi-x-circle-fill text-red-500"></i>';
      
      // Generar ID único para el test case
      const testCaseId = `testcase-link-${index}`;
      const scenarioFeatureId = `feature-${testCase.featureName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
      
      return `
        <tr class="hover:bg-gray-50 ${testCase.status === 'FAILED' ? 'bg-red-50' : ''}">
          <td class="px-4 py-3">
            <a href="#steps-details" onclick="showTab('steps-details'); scrollToFeature('${scenarioFeatureId}'); setTimeout(() => { const accordion = document.querySelector('[onclick*=\\'${testCaseId}\\']'); if (accordion) accordion.click(); }, 300); return false;" class="text-blue-600 hover:underline">${this.escapeHtml(testCase.scenarioName)}</a>
          </td>
          <td class="px-4 py-3 text-center">${testCase.steps.length}</td>
          <td class="px-4 py-3 text-center">${formatTimeShort(testCase.startTime)}</td>
          <td class="px-4 py-3 text-center">${formatDuration(testCase.duration)}</td>
          <td class="px-4 py-3 text-center">${statusIcon}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="mb-4">
        <input type="text" id="testCaseFilter" placeholder="Filter test cases..." 
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Case</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Steps</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Started</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Result</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200" id="testCasesTableBody">
            ${testCasesRows}
          </tbody>
        </table>
      </div>
      <script>
        document.getElementById('testCaseFilter')?.addEventListener('input', function(e) {
          const filter = e.target.value.toLowerCase();
          const rows = document.querySelectorAll('#testCasesTableBody tr');
          rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
          });
        });
      </script>
    `;
  }

  private generateScenariosHtml(report: TestReport, formatDuration: (ms: number) => string, formatTimeShort: (iso: string) => string): string {
    if (!report.scenarios || report.scenarios.length === 0) {
      return '<div class="bg-white rounded-lg shadow p-6"><p class="text-gray-500">No scenarios executed</p></div>';
    }

    const scenariosAccordions = report.scenarios.map((scenario, index) => {
      const testCasesAccordions = scenario.testCases.map((testCase, tcIndex) => {
        const testCaseId = `testcase-${index}-${tcIndex}`;
        const stepsHtml = testCase.steps.map(step => this.generateStepHtml(step, formatDuration, formatTimeShort)).join('');
        const exampleHtml = testCase.example ? `<span class="text-sm text-gray-500">(${JSON.stringify(testCase.example)})</span>` : '';
        const statusClass = testCase.status === 'PASSED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        
        return `
          <div id="${testCaseId}" class="border border-gray-200 rounded-lg mb-2">
            <button onclick="toggleAccordion('${testCaseId}')" 
              class="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <i id="accordion-icon-${testCaseId}" class="bi bi-chevron-down text-gray-500"></i>
                <span class="font-medium">${this.escapeHtml(testCase.scenarioName)}</span>
                ${exampleHtml}
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusClass}">
                  ${testCase.status}
                </span>
              </div>
              <div class="text-sm text-gray-500">
                ${formatDuration(testCase.duration)} • ${testCase.steps.length} steps
              </div>
            </button>
            <div id="accordion-${testCaseId}" class="hidden p-6 bg-white">
              ${stepsHtml}
            </div>
          </div>
        `;
      }).join('');

      const failedHtml = scenario.failedTestCases > 0 ? `<span class="text-sm text-red-600">${scenario.failedTestCases} failed</span>` : '';

      // Generar ID único para el feature
      const featureId = `feature-${scenario.featureName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
      
      return `
        <div id="${featureId}" class="bg-white rounded-lg shadow-md mb-6">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-xl font-semibold">${this.escapeHtml(scenario.featureName)}</h3>
            <p class="text-gray-600 mt-1">${this.escapeHtml(scenario.name)}</p>
            <div class="mt-2 flex items-center space-x-4">
              <span class="text-sm text-gray-600">${scenario.totalTestCases} test cases</span>
              <span class="text-sm text-green-600">${scenario.passedTestCases} passed</span>
              ${failedHtml}
            </div>
          </div>
          <div class="p-6">
            ${testCasesAccordions}
          </div>
        </div>
      `;
    }).join('');

    return scenariosAccordions;
  }

  private generateStepHtml(step: TestStep, formatDuration: (ms: number) => string, formatTimeShort: (iso: string) => string): string {
    const statusColors: Record<string, string> = {
      PASSED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      SKIPPED: 'bg-yellow-100 text-yellow-800',
      PENDING: 'bg-blue-100 text-blue-800',
    };
    
    const screenshotPath = step.screenshot
      ? path.relative(this.currentReportDir, step.screenshot).replace(/\\/g, "/")
      : null;

    const borderColor = step.status === 'PASSED' ? 'border-green-500' : step.status === 'FAILED' ? 'border-red-500' : 'border-gray-300';
    const statusColorClass = statusColors[step.status] || 'bg-gray-100 text-gray-800';
    
    const screenshotHtml = screenshotPath ? `
          <div class="mt-3">
            <img src="${screenshotPath}" alt="Step ${step.stepNumber}" 
              onclick="openScreenshotModal('${screenshotPath}')" 
              class="max-w-2xl cursor-pointer rounded-lg shadow-md hover:shadow-lg transition-shadow">
          </div>
        ` : '';
    
    const errorHtml = step.error ? `
          <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <strong class="text-red-800">Error:</strong>
            <pre class="mt-2 text-sm text-red-700 whitespace-pre-wrap">${this.escapeHtml(step.error)}</pre>
          </div>
        ` : '';
    
    const logsHtml = step.logs && step.logs.length > 0 ? `
          <div class="mt-3 space-y-1">
            ${step.logs.map(log => {
              const logColorClass = log.level === 'ERROR' ? 'text-red-600' : log.level === 'SUCCESS' ? 'text-green-600' : 'text-gray-600';
              const elementText = log.element ? ` - Elemento: ${this.escapeHtml(log.element)}` : '';
              const actionText = log.action ? ` - Acción: ${this.escapeHtml(log.action)}` : '';
              return `
              <div class="text-xs ${logColorClass}">
                [${formatTimeShort(log.timestamp)}] ${this.escapeHtml(log.message)}${elementText}${actionText}
              </div>
            `;
            }).join('')}
          </div>
        ` : '';

    return `
      <div class="border-l-4 ${borderColor} bg-gray-50 p-4 mb-3 rounded-r-lg">
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColorClass}">
              ${step.status}
            </span>
            <span class="font-medium">Step ${step.stepNumber}: ${this.escapeHtml(step.description)}</span>
          </div>
          <div class="text-sm text-gray-500">
            ${formatDuration(step.duration || 0)} • ${formatTimeShort(step.timestamp)}
          </div>
        </div>
        ${screenshotHtml}
        ${errorHtml}
        ${logsHtml}
      </div>
    `;
  }

  private generateLogsHtml(report: TestReport, isSuccess: boolean, formatTimeShort: (iso: string) => string): string {
    const logs = isSuccess ? (report.successLogs || []) : (report.errorLogs || []);
    const title = isSuccess ? 'Success Logs' : 'Error Logs';
    const icon = isSuccess ? 'bi-check-circle' : 'bi-x-circle';
    const logType = isSuccess ? 'success' : 'error';
    const filterFunctionName = isSuccess ? 'Success' : 'Error';
    const logTypeText = isSuccess ? 'success' : 'error';

    if (logs.length === 0) {
      return `
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <i class="bi ${icon} mr-2"></i> ${title}
          </h3>
          <p class="text-gray-500">No ${logTypeText} logs recorded</p>
        </div>
      `;
    }

    const logsRows = logs.map((log, index) => {
      const rowClass = `${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${!isSuccess ? 'hover:bg-red-50' : 'hover:bg-green-50'}`;
      const messageClass = !isSuccess ? 'text-red-600' : '';
      return `
      <tr class="${rowClass}">
        <td class="px-4 py-3 text-sm">${formatTimeShort(log.timestamp)}</td>
        <td class="px-4 py-3 text-sm">${log.element || '-'}</td>
        <td class="px-4 py-3 text-sm">${log.action || '-'}</td>
        <td class="px-4 py-3 text-sm ${messageClass}">${this.escapeHtml(log.message)}</td>
        <td class="px-4 py-3 text-sm">${log.details ? this.escapeHtml(log.details) : '-'}</td>
      </tr>
    `;
    }).join('');

    return `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-xl font-semibold mb-4 flex items-center">
          <i class="bi ${icon} mr-2"></i> ${title}
        </h3>
        <p class="text-gray-600 mb-4">Total: <strong>${logs.length}</strong> logs</p>
        
        <!-- Search -->
        <div class="mb-4">
          <input type="text" id="${logType}LogsSearch" placeholder="Search logs..." 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Elemento</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mensaje</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
              </tr>
            </thead>
            <tbody id="${logType}LogsTableBody" class="bg-white divide-y divide-gray-200">
              ${logsRows}
            </tbody>
          </table>
        </div>
      </div>

      <script>
        function filter${filterFunctionName}Logs() {
          const search = document.getElementById('${logType}LogsSearch').value.toLowerCase();
          const rows = document.querySelectorAll('#${logType}LogsTableBody tr');
          rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(search) ? '' : 'none';
          });
        }

        document.getElementById('${logType}LogsSearch')?.addEventListener('input', filter${filterFunctionName}Logs);
      </script>
    `;
  }

  private generateTestResultsContent(report: TestReport, formatDuration: (ms: number) => string, formatTimeShort: (iso: string) => string): string {
    return this.generateTestCasesHtml(report, formatDuration, formatTimeShort);
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}