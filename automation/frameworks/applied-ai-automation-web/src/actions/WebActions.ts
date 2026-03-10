import { AutomationClient } from "../configs/AutomationClient";
import { z } from "zod/v3";

/**
 * Generic web interaction layer wrapping AutomationClient/Stagehand.
 * Provides reusable methods for all tests.
 * Includes visual stabilization strategies to prevent interacting with
 * elements that have not yet been rendered, and to avoid black screenshots.
 */
export class WebActions {
  private readonly client: AutomationClient;
  private static readonly MAX_WAIT = 120000;           // 2 minutes maximum
  private static readonly VISUAL_BUFFER_DEFAULT = 2000; // 2 s default buffer
  private static readonly VISUAL_BUFFER_NAVIGATION = 5000; // 5 s after navigation

  constructor(client: AutomationClient) {
    this.client = client;
  }

  /**
   * Navigate to a URL and wait for the page to be fully rendered.
   * Integrates visual stabilization to avoid black screenshots.
   *
   * @param url - The URL to navigate to
   * @param waitForLoad - When true, waits for full visual load (recommended)
   */
  async navigateTo(url: string, waitForLoad: boolean = true): Promise<void> {
    try {
      console.info(`Info - Navigating to: ${url}`);

      await this.client.navigateTo(url);

      if (waitForLoad) {
        await this.waitForFullVisualLoad(WebActions.VISUAL_BUFFER_NAVIGATION);

        const currentUrl = this.client.getCurrentUrl();
        if (!currentUrl.includes(new URL(url).hostname)) {
          console.warn(`Warning - Current URL (${currentUrl}) does not fully match expected (${url})`);
        }

        console.info(`Success - Page found and visually rendered: ${url}`);
      }
    } catch (error) {
      console.error(`Error navigating to: ${url}`, error);
      throw error;
    }
  }

  /**
   * Execute a natural-language action via Stagehand.
   * Waits for visual stabilization before acting and highlights the target element.
   *
   * @param instruction - Natural-language instruction for Stagehand
   * @param elementSelector - Optional selector to highlight before the action
   */
  async executeAction(instruction: string, elementSelector?: string): Promise<void> {
    try {
      await this.waitForVisualStabilization(WebActions.VISUAL_BUFFER_DEFAULT);

      if (elementSelector) {
        try {
          await this.highlightElement(elementSelector, 1000);
        } catch (error) {
          console.warn(`Could not highlight element ${elementSelector}, continuing...`, error);
        }
      }

      await this.client.executeAction(instruction);

      await this.wait(500);
    } catch (error) {
      console.error(`Error executing action: ${instruction}`, error);
      throw error;
    }
  }

  /**
   * Extract structured data from the page using a Zod schema.
   * Waits for visual stabilization before extracting.
   *
   * @param instruction - Natural-language instruction for data extraction
   * @param schema - Zod schema to validate the extracted data
   */
  async extractData<T>(instruction: string, schema: z.ZodSchema<T>): Promise<T> {
    try {
      await this.waitForVisualStabilization(WebActions.VISUAL_BUFFER_DEFAULT);

      return await this.client.extractData(instruction, schema);
    } catch (error) {
      console.error(`Error extracting data with instruction: ${instruction}`, error);
      throw error;
    }
  }

  /**
   * Observe available elements on the page using a natural-language instruction.
   * Waits for visual stabilization before observing.
   *
   * @param instruction - Natural-language instruction describing what to observe
   */
  async observeElements(instruction: string): Promise<any> {
    try {
      await this.waitForVisualStabilization(WebActions.VISUAL_BUFFER_DEFAULT);

      return await this.client.observeElements(instruction);
    } catch (error) {
      console.error(`Error observing elements with instruction: ${instruction}`, error);
      throw error;
    }
  }

  /**
   * Take a screenshot after waiting for the page to load completely.
   *
   * @param path - File path where the screenshot will be saved
   * @param waitForLoad - When true, waits for full visual load before capturing
   */
  async takeScreenshot(path: string, waitForLoad: boolean = true): Promise<void> {
    try {
      if (waitForLoad) {
        await this.waitForFullVisualLoad(WebActions.VISUAL_BUFFER_DEFAULT);
      }

      await this.client.takeScreenshot(path);
      console.info(`Success - Screenshot saved at: ${path}`);
    } catch (error) {
      console.error(`Error taking screenshot at: ${path}`, error);
      throw error;
    }
  }

  /**
   * Wait for a given number of milliseconds.
   */
  async wait(milliseconds: number): Promise<void> {
    await this.client.wait(milliseconds);
  }

  /**
   * Return the current page URL.
   */
  getCurrentUrl(): string {
    return this.client.getCurrentUrl();
  }

  /**
   * Return true if the current URL contains the given text.
   */
  urlContains(text: string): boolean {
    return this.getCurrentUrl().includes(text);
  }

  /**
   * Visually highlight an element before interacting with it.
   * Useful for debugging and ensuring interaction with the correct element.
   *
   * @param selector - CSS or XPath selector of the element to highlight
   * @param duration - Highlight duration in milliseconds (default: 2000 ms)
   */
  async highlightElement(selector: string, duration: number = 2000): Promise<void> {
    try {
      const page = this.client.getMainPage();

      if (page && typeof (page as any).evaluate === "function") {
        await (page as any).evaluate(
          (sel: string, dur: number) => {
            try {
              let element: any = null;

              if (sel.startsWith("//") || sel.startsWith("/")) {
                const result = (globalThis as any).document.evaluate(
                  sel,
                  (globalThis as any).document,
                  null,
                  (globalThis as any).XPathResult.FIRST_ORDERED_NODE_TYPE,
                  null
                );
                element = result.singleNodeValue;
              } else {
                element = (globalThis as any).document.querySelector(sel);
              }

              if (element) {
                const originalStyle = element.style.boxShadow;
                const originalOutline = element.style.outline;

                element.style.boxShadow = "0 0 10px 3px rgba(255, 0, 0, 0.8)";
                element.style.outline = "2px solid red";
                element.style.zIndex = "9999";

                setTimeout(() => {
                  if (element) {
                    element.style.boxShadow = originalStyle || "";
                    element.style.outline = originalOutline || "";
                    element.style.zIndex = "";
                  }
                }, dur);
              }
            } catch (error: any) {
              console.warn("Could not highlight element:", error);
            }
          },
          selector,
          duration
        );
      }
    } catch (error) {
      console.warn(`Could not highlight element with selector: ${selector}`, error);
      // Do not throw — highlighting is non-critical
    }
  }

  /**
   * Wait until the page is fully rendered before continuing.
   * Combines network-idle, DOM-ready, and visible-content checks to prevent
   * interacting with blank/white screens or unrendered elements.
   *
   * Optimized for pages that take 1–2 minutes to load completely.
   *
   * @param bufferMs - Extra time in ms to allow painting to complete (default: 5000 ms)
   */
  async waitForFullVisualLoad(bufferMs: number = WebActions.VISUAL_BUFFER_NAVIGATION): Promise<void> {
    try {
      console.info("Info - Waiting for full visual render...");

      const page = this.client.getMainPage();

      if (!page) {
        console.warn("Warning - No page available to wait for visual load");
        await this.wait(bufferMs);
        return;
      }

      // 1. Wait for network idle (critical for API-driven pages)
      if (typeof (page as any).waitForLoadState === "function") {
        await (page as any).waitForLoadState("networkidle", { timeout: 150000 }).catch(() => {
          console.warn("Warning - Network did not reach idle state after 2.5 minutes, continuing...");
        });
      }

      // 2. Wait for DOM to be interactive
      if (typeof (page as any).waitForLoadState === "function") {
        await (page as any).waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {
          console.warn("Warning - DOM did not load completely, continuing...");
        });
      }

      // 3. Anti-blank-screen check: wait until body has height and visible text
      if (typeof (page as any).waitForFunction === "function") {
        await (page as any).waitForFunction(
          () => {
            const body = (globalThis as any).document?.body;
            return body && body.scrollHeight > 50 && body.innerText.trim().length > 0;
          },
          { timeout: 150000 }
        ).catch(() => {
          console.warn("Warning - Could not validate visible content, continuing...");
        });
      }

      // 4. Painting buffer — allows the browser to finish drawing pixels
      if (bufferMs > 0) {
        console.info(`Info - Waiting ${bufferMs}ms rendering buffer...`);
        await this.wait(bufferMs);
      }

      console.info("Success - Page is visually stable and rendered.");
    } catch (error) {
      console.warn("Warning - Problem waiting for visual load:", error);
      await this.wait(WebActions.VISUAL_BUFFER_DEFAULT);
    }
  }

  /**
   * Wait until a specific element is stabilized and ready for interaction.
   * Verifies the element is visible and has non-zero dimensions.
   * Lighter than waitForFullVisualLoad — checks a single element, not the whole page.
   *
   * @param selector - CSS or XPath selector of the element to stabilize
   * @param bufferMs - Extra time in ms after the element is ready (default: 2000 ms)
   */
  async waitForElementStabilization(selector: string, bufferMs: number = WebActions.VISUAL_BUFFER_DEFAULT): Promise<void> {
    try {
      const page = this.client.getMainPage();

      if (!page) {
        console.warn("Warning - No page available to wait for element stabilization");
        await this.wait(bufferMs);
        return;
      }

      if (typeof (page as any).waitForFunction === "function") {
        await (page as any).waitForFunction(
          (sel: string) => {
            try {
              let element: any = null;

              if (sel.startsWith("//") || sel.startsWith("/")) {
                const result = (globalThis as any).document.evaluate(
                  sel,
                  (globalThis as any).document,
                  null,
                  (globalThis as any).XPathResult.FIRST_ORDERED_NODE_TYPE,
                  null
                );
                element = result.singleNodeValue;
              } else {
                element = (globalThis as any).document.querySelector(sel);
              }

              if (element) {
                const rect = element.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && element.offsetParent !== null;
              }
              return false;
            } catch {
              return false;
            }
          },
          selector,
          { timeout: WebActions.MAX_WAIT }
        ).catch(() => {
          console.warn(`Warning - Could not validate element stabilization: ${selector}`);
        });
      }

      if (bufferMs > 0) {
        await this.wait(bufferMs);
      }
    } catch (error) {
      console.warn(`Warning - Problem waiting for element stabilization: ${selector}`, error);
      await this.wait(WebActions.VISUAL_BUFFER_DEFAULT);
    }
  }

  /**
   * Wait for general visual stabilization before executing actions.
   * Combines DOM-ready check with a painting buffer.
   *
   * @param bufferMs - Buffer time in ms (default: 2000 ms)
   */
  private async waitForVisualStabilization(bufferMs: number = WebActions.VISUAL_BUFFER_DEFAULT): Promise<void> {
    try {
      const page = this.client.getMainPage();

      if (!page) {
        await this.wait(bufferMs);
        return;
      }

      if (typeof (page as any).waitForLoadState === "function") {
        await (page as any).waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
      }

      if (bufferMs > 0) {
        await this.wait(bufferMs);
      }
    } catch (error) {
      console.warn("Warning - Error in visual stabilization wait:", error);
      await this.wait(bufferMs);
    }
  }

  /**
   * Wait for the page to load completely.
   * @deprecated Use waitForFullVisualLoad() for better visual stabilization.
   */
  async waitForPageLoad(): Promise<void> {
    await this.waitForFullVisualLoad(WebActions.VISUAL_BUFFER_DEFAULT);
  }
}
