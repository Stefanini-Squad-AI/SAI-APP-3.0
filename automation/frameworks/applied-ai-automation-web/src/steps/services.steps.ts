/**
 * Step definitions for the TuCreditoOnline Services page (TCO-19).
 * Instructions are derived directly from the Gherkin step text — no duplication.
 */
import { WebActions } from "../actions/WebActions";
import { ReportGenerator } from "../hooks/ReportGenerator";
import { ServicesConstants } from "../constants/ServicesConstants";
import { z } from "zod/v3";

export class ServicesSteps {
  private actions: WebActions;
  private reportGenerator: ReportGenerator;

  constructor(actions: WebActions, reportGenerator: ReportGenerator) {
    this.actions = actions;
    this.reportGenerator = reportGenerator;
  }

  /**
   * Given: Navigate to the application
   */
  async givenNavigateToAppPage(): Promise<void> {
    this.reportGenerator.addInfoLog(
      "Starting navigation to the application",
      undefined,
      "navigateTo",
      `URL: ${ServicesConstants.BASE_URL}`
    );

    await this.reportGenerator.addStep(
      `Navigating to ${ServicesConstants.BASE_URL}`,
      true,
      this.actions,
      undefined,
      undefined,
      {
        element: "Browser",
        action: "Navigate to URL",
        instruction: `Navigate to ${ServicesConstants.BASE_URL}`,
      }
    );

    await this.actions.navigateTo(ServicesConstants.BASE_URL);
    this.reportGenerator.addSuccessLog(
      "Navigation completed successfully",
      "Browser",
      "navigateTo",
      `Current URL: ${this.actions.getCurrentUrl()}`
    );
    await this.actions.wait(1000);
  }

  /**
   * When: Click the "Services" option in the top navigation menu
   */
  async whenClickMenuServices(menuOption: string): Promise<void> {
    const instruction = `Click the "${menuOption}" or "Services" option in the top navigation menu`;
    this.reportGenerator.addInfoLog(
      "Preparing to click Services in the nav menu",
      "Top nav menu",
      "click",
      instruction
    );

    await this.reportGenerator.addStep(
      `Clicking the "${menuOption}" menu option`,
      true,
      this.actions,
      undefined,
      undefined,
      {
        element: "Services menu item",
        action: "Click",
        instruction,
      }
    );

    await this.actions.executeAction(instruction);
    this.reportGenerator.addSuccessLog(
      "Services menu item clicked",
      "Services menu item",
      "click",
      "Waiting for /services to load..."
    );
    await this.actions.wait(2000);
  }

  /**
   * Then: Verify that the expected titles are visible on the Services page
   */
  async thenShouldSeeServicesTitles(title1: string, title2: string): Promise<void> {
    const expectedTitles = [title1.toLowerCase().trim(), title2.toLowerCase().trim()];

    this.reportGenerator.addInfoLog(
      "Verifying titles on the Services page",
      "Sections",
      "verify",
      `Expected: ${expectedTitles.join(", ")}`
    );

    await this.reportGenerator.addStep(
      `Verifying titles: ${expectedTitles.join(" and ")}`,
      true,
      this.actions,
      undefined,
      undefined,
      {
        element: "Services page sections",
        action: "Verify titles",
        instruction: "Extract the section titles or headings on the page",
      }
    );

    const sectionTitleSchema = z.object({
      sectionTitles: z.array(z.string()),
    });

    const pageInfo = await this.actions.extractData(
      "Extract the titles or headings of the main sections on this page (e.g. Our Services, Not sure which one to choose?, or equivalents). Return an object with a sectionTitles property as an array of strings.",
      sectionTitleSchema
    );

    const extractedTitles = (pageInfo.sectionTitles || []).map((t: string) =>
      t.toLowerCase().trim()
    );

    for (const expected of expectedTitles) {
      const found = extractedTitles.some(
        (t: string) => t.includes(expected) || expected.includes(t)
      );
      if (!found) {
        this.reportGenerator.addErrorLog(
          "Services page titles do not match",
          "Sections",
          "verify",
          `Expected: "${expected}". Found: ${extractedTitles.join(", ")}`
        );
        throw new Error(
          `Expected title "${expected}" not found. Titles found: ${extractedTitles.join(", ") || "none"}`
        );
      }
    }

    this.reportGenerator.addSuccessLog(
      "Services page titles verified successfully",
      "Sections",
      "verify",
      `Found: ${extractedTitles.join(", ")}`
    );
  }
}
