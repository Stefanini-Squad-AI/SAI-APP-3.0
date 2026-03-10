import { AutomationClient } from "../configs/AutomationClient";
import { ReportGenerator } from "../hooks/ReportGenerator";
import { WebActions } from "../actions/WebActions";
import { GherkinFeature, GherkinStep, GherkinParser } from "./GherkinParser";
import { StepRegistry } from "./StepRegistry";

export class GherkinExecutor {
  private client: AutomationClient;
  private reportGenerator: ReportGenerator;
  private actions: WebActions;
  private stepRegistry: StepRegistry;

  constructor(client: AutomationClient, reportGenerator: ReportGenerator) {
    this.client = client;
    this.reportGenerator = reportGenerator;
    this.actions = new WebActions(client);
    this.stepRegistry = new StepRegistry(this.actions, this.reportGenerator, this.client);
  }

  private async executeStep(step: GherkinStep, context?: Record<string, string>): Promise<void> {
    // Normalizar "And" y "But" al paso anterior
    let stepText = step.text;
    
    // Reemplazar placeholders si hay contexto
    if (context) {
      stepText = GherkinParser.replacePlaceholders(stepText, context);
    }

    console.log(`📝 Ejecutando paso Gherkin: ${step.keyword} ${stepText}`);
    await this.stepRegistry.executeStep(stepText, context);
  }

  async executeFeature(feature: GherkinFeature): Promise<void> {
    try {
      // Ejecutar Background
      if (feature.background && feature.background.length > 0) {
        for (const step of feature.background) {
          await this.executeStep(step);
        }
      }

      // Ejecutar Scenarios
      for (const scenario of feature.scenarios) {
        // Iniciar tracking del escenario
        this.reportGenerator.startScenario(scenario.name, feature.name);
        
        await this.reportGenerator.addStep(
          `Ejecutando escenario: ${scenario.name}`,
          true,
          this.actions,
          scenario.tags,
          feature.name
        );

        if (scenario.examples && scenario.examples.length > 0) {
          // Scenario Outline con Examples
          for (const example of scenario.examples) {
            // Iniciar tracking del test case
            this.reportGenerator.startTestCase(scenario.name, feature.name, example);
            
            await this.reportGenerator.addStep(
              `Ejecutando ejemplo: ${JSON.stringify(example)}`,
              false,
              this.actions,
              scenario.tags,
              feature.name
            );

            try {
              for (const step of scenario.steps) {
                await this.executeStep(step, example);
              }
              // Finalizar test case como exitoso
              this.reportGenerator.endTestCase("PASSED");
            } catch (error: any) {
              // Finalizar test case como fallido
              this.reportGenerator.endTestCase("FAILED", error?.message || String(error));
              throw error;
            }
          }
        } else {
          // Scenario normal
          // Iniciar tracking del test case
          this.reportGenerator.startTestCase(scenario.name, feature.name);
          
          try {
            for (const step of scenario.steps) {
              await this.executeStep(step);
            }
            // Finalizar test case como exitoso
            this.reportGenerator.endTestCase("PASSED");
          } catch (error: any) {
            // Finalizar test case como fallido
            this.reportGenerator.endTestCase("FAILED", error?.message || String(error));
            throw error;
          }
        }
        
        // Finalizar tracking del escenario
        this.reportGenerator.endScenario();
      }

      await this.reportGenerator.generateReport("PASSED");
      console.log("\n🎉 Test Gherkin completado exitosamente");
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      this.reportGenerator.markStepAsFailed(errorMessage);
      await this.reportGenerator.generateReport("FAILED");
      throw error;
    }
    // El cierre del cliente se maneja en LoginTest.finally()
  }
}
