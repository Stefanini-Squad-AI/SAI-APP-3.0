/**
 * Step definitions for switching the application language to Portuguese (TCO-11).
 * Instructions are derived directly from the Gherkin step text — no duplication.
 */
import { WebActions } from "../actions/WebActions";
import { ReportGenerator } from "../hooks/ReportGenerator";

export class LanguagePtSteps {
  private actions: WebActions;
  private reportGenerator: ReportGenerator;

  constructor(actions: WebActions, reportGenerator: ReportGenerator) {
    this.actions = actions;
    this.reportGenerator = reportGenerator;
  }

  /**
   * When: Select Portuguese from the language dropdown
   */
  async whenSelectPortugueseLanguage(): Promise<void> {
    const instruction = "Select the Portuguese language option";
    this.reportGenerator.addInfoLog(
      "Preparing to select Portuguese",
      "Portuguese option",
      "click",
      instruction
    );

    await this.reportGenerator.addStep(
      "Selecting Portuguese language",
      true,
      this.actions,
      undefined,
      undefined,
      {
        element: "Portuguese option",
        action: "Click / Select",
        instruction,
      }
    );

    await this.actions.executeAction(instruction);
    this.reportGenerator.addSuccessLog(
      "Portuguese language selected",
      "Portuguese option",
      "click",
      "Waiting for page update..."
    );
    await this.actions.wait(2000);
  }
}
