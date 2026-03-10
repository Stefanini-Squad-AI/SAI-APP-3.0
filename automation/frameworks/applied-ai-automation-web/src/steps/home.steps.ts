/**
 * Step definitions for the TuCreditoOnline Home page.
 * Instructions are derived directly from the Gherkin step text — no duplication.
 */
import { WebActions } from "../actions/WebActions";
import { ReportGenerator } from "../hooks/ReportGenerator";
import { HomeConstants } from "../constants/HomeConstants";
import { z } from "zod/v3";

export class HomeSteps {
  private actions: WebActions;
  private reportGenerator: ReportGenerator;

  constructor(actions: WebActions, reportGenerator: ReportGenerator) {
    this.actions = actions;
    this.reportGenerator = reportGenerator;
  }

  /**
   * Given: Navigate to the TuCreditoOnline home page
   */
  async givenNavigateToHomePage(): Promise<void> {
    this.reportGenerator.addInfoLog(
      "Starting navigation to home page",
      undefined,
      "navigateTo",
      `URL: ${HomeConstants.BASE_URL}`
    );

    await this.reportGenerator.addStep(
      `Navigating to ${HomeConstants.BASE_URL}`,
      true,
      this.actions,
      undefined,
      undefined,
      {
        element: "Browser",
        action: "Navigate to URL",
        instruction: `Navigate to ${HomeConstants.BASE_URL}`,
      }
    );

    await this.actions.navigateTo(HomeConstants.BASE_URL);
    this.reportGenerator.addSuccessLog(
      "Navigation completed successfully",
      "Browser",
      "navigateTo",
      `Current URL: ${this.actions.getCurrentUrl()}`
    );
    await this.actions.wait(1000);
  }

  /**
   * When: Click the language dropdown next to the admin login button
   */
  async whenClickLanguageDropdown(): Promise<void> {
    const instruction =
      "Click the language switcher dropdown that is next to the admin login button";
    this.reportGenerator.addInfoLog(
      "Preparing to click the language dropdown",
      "Language dropdown",
      "click",
      instruction
    );

    try {
      const elements = await this.actions.observeElements(
        "Show the language switcher dropdown next to the admin login button"
      );
      if (elements && Array.isArray(elements) && elements.length > 0) {
        const dropdown = elements.find(
          (el: any) =>
            el.description?.toLowerCase().includes("language") ||
            el.description?.toLowerCase().includes("dropdown") ||
            el.xpath
        );
        if (dropdown?.xpath) {
          await this.actions.highlightElement(dropdown.xpath, 1000);
        }
      }
    } catch (error) {
      console.warn(
        "Could not observe/highlight the language dropdown, continuing...",
        error
      );
    }

    await this.reportGenerator.addStep(
      "Clicking the language switcher dropdown",
      true,
      this.actions,
      undefined,
      undefined,
      {
        element: "Language dropdown",
        action: "Click",
        instruction,
      }
    );

    await this.actions.executeAction(instruction);
    this.reportGenerator.addSuccessLog(
      "Language dropdown clicked",
      "Language dropdown",
      "click",
      "Waiting for options..."
    );
    await this.actions.wait(1000);
  }

  /**
   * When: Select English
   */
  async whenSelectEnglishLanguage(): Promise<void> {
    const instruction = "Select the English language option";
    this.reportGenerator.addInfoLog(
      "Preparing to select English",
      "English option",
      "click",
      instruction
    );

    await this.reportGenerator.addStep(
      "Selecting English language",
      true,
      this.actions,
      undefined,
      undefined,
      {
        element: "English option",
        action: "Click / Select",
        instruction,
      }
    );

    await this.actions.executeAction(instruction);
    this.reportGenerator.addSuccessLog(
      "English language selected",
      "English option",
      "click",
      "Waiting for page update..."
    );
    await this.actions.wait(2000);
  }

  /**
   * Then: Verify that the expected section titles are visible in English
   */
  async thenShouldSeeSectionTitles(
    title1: string,
    title2: string,
    title3: string
  ): Promise<void> {
    const expectedTitles = [
      title1.toLowerCase(),
      title2.toLowerCase(),
      title3.toLowerCase(),
    ];

    this.reportGenerator.addInfoLog(
      "Verifying section titles",
      "Sections",
      "verify",
      `Expected: ${expectedTitles.join(", ")}`
    );

    await this.reportGenerator.addStep(
      `Verifying section titles: ${expectedTitles.join(", ")}`,
      true,
      this.actions,
      undefined,
      undefined,
      {
        element: "Page sections",
        action: "Verify titles",
        instruction: "Extract the main section titles from the page",
      }
    );

    const sectionTitleSchema = z.object({
      sectionTitles: z.array(z.string()),
    });

    const pageInfo = await this.actions.extractData(
      "Extract the titles or headings of the main sections on the page (e.g. About Us, Our Services, Visit Us or equivalents). Return an object with a sectionTitles property as an array of strings.",
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
          "Section titles do not match",
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
      "Section titles verified successfully",
      "Sections",
      "verify",
      `Found: ${extractedTitles.join(", ")}`
    );
  }
}
