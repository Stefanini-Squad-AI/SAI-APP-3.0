/**
 * Common step definitions reusable by any test.
 * Equivalent to generic page objects.
 */
import { WebActions } from "../actions/WebActions";
import { ReportGenerator } from "../hooks/ReportGenerator";
import { AutomationClient } from "../configs/AutomationClient";

export class CommonSteps {
  private actions: WebActions;
  private reportGenerator: ReportGenerator;
  private client: AutomationClient;

  constructor(actions: WebActions, reportGenerator: ReportGenerator, client: AutomationClient) {
    this.actions = actions;
    this.reportGenerator = reportGenerator;
    this.client = client;
  }

  /**
   * Given: The browser is open
   * Reusable by ALL tests.
   * initialize() is idempotent — safe to call multiple times.
   */
  async givenBrowserIsOpen(): Promise<void> {
    await this.reportGenerator.addStep(
      "Verifying the browser is open",
      false,
      this.actions
    );
    await this.client.initialize();
  }

  /**
   * Given: Navigate to a specific URL
   * Reusable by ALL tests.
   */
  async givenNavigateToUrl(url: string): Promise<void> {
    await this.reportGenerator.addStep(
      `Navigating to ${url}`,
      true,
      this.actions
    );
    await this.actions.navigateTo(url);
    await this.actions.wait(1000);
  }

  /**
   * Then: Verify the current URL contains a given text
   * Reusable by ALL tests.
   */
  async thenUrlShouldContain(text: string): Promise<void> {
    await this.reportGenerator.addStep(
      `Verifying the URL contains: ${text}`,
      true,
      this.actions
    );
    if (!this.actions.urlContains(text)) {
      throw new Error(
        `URL does not contain "${text}". Current URL: ${this.actions.getCurrentUrl()}`
      );
    }
  }
}
