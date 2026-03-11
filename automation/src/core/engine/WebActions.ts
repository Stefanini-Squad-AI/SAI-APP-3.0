/**
 * AURA — WebActions
 * Motor de interacción con elementos web. Equivalente AURA-nativo al WebActions
 * del framework de referencia, sin dependencias de Stagehand ni similares.
 *
 * Responsabilidades:
 *  - Estabilización visual anti-pantalla-negra
 *  - Resaltado de elementos para debugging visual
 *  - Captura de screenshots temporizado
 *  - Interacciones enriquecidas con timeout adaptativo
 *  - Delegación al IntentBuilder para resolución semántica
 */
import type { Page, Locator } from 'playwright';
import { IntentBuilder } from '../intent/IntentBuilder';
import { IntentProxy } from '../intent/IntentProxy';
import type { IntentResult } from '../../types/index';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEOUT_VISUAL_LOAD   = 150_000; // 2.5 min (páginas pesadas / SPA)
const TIMEOUT_ELEMENT_READY =  30_000; // 30 s estándar por elemento
const BUFFER_NAVIGATION     =   5_000; // post-navigate painting buffer
const BUFFER_ACTION         =   1_500; // post-action micro-buffer
const BUFFER_MINI            =    500; // micro-espera post-acción

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WebActionsOptions {
  /** Milliseconds to wait for page visual stability. Default: 5000 */
  navigationBuffer?: number;
  /** Milliseconds for post-action stabilization. Default: 1500 */
  actionBuffer?: number;
  /** Whether to highlight elements before interacting. Default: true */
  highlightOnAction?: boolean;
  /** Color for element highlight. Default: '#6366f1' (AURA violet) */
  highlightColor?: string;
}

export interface NavigateOptions {
  waitForLoad?: boolean;
  waitForSelector?: string;
  timeout?: number;
}

export interface WaitForElementOptions {
  state?: 'visible' | 'hidden' | 'attached' | 'detached';
  timeout?: number;
}

export interface ScreenshotOptions {
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
}

// ─── WebActions ───────────────────────────────────────────────────────────────

export class WebActions {
  private readonly intentBuilder: IntentBuilder;
  private readonly opts: Required<WebActionsOptions>;
  private beforeClickHook?: (page: Page) => Promise<void>;

  constructor(
    private readonly page: Page,
    intentBuilder?: IntentBuilder,
    options: WebActionsOptions = {},
  ) {
    this.intentBuilder = intentBuilder ?? IntentBuilder.for(page);
    this.opts = {
      navigationBuffer:  options.navigationBuffer  ?? BUFFER_NAVIGATION,
      actionBuffer:      options.actionBuffer       ?? BUFFER_ACTION,
      highlightOnAction: options.highlightOnAction  ?? true,
      highlightColor:    options.highlightColor     ?? '#6366f1',
    };

    IntentProxy.configureHighlight(this.opts.highlightOnAction, this.opts.highlightColor);
  }

  /**
   * Registers a hook that fires BEFORE each click action.
   * Used by the report collector to capture a pre-action screenshot
   * so the evidence shows the element being targeted, not the result.
   */
  setBeforeClickHook(hook: (page: Page) => Promise<void>): void {
    this.beforeClickHook = hook;
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Navega a una URL y espera estabilización visual completa.
   * Previene screenshots negros y acciones en DOM no renderizado.
   */
  async navigateTo(url: string, options: NavigateOptions = {}): Promise<void> {
    const { waitForLoad = true, waitForSelector, timeout } = options;

    console.info(`[AURA/WebActions] ↗ Navigating to: ${url}`);

    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: timeout ?? TIMEOUT_VISUAL_LOAD,
    });

    if (waitForLoad) {
      await this.waitForVisualLoad(this.opts.navigationBuffer);
    }

    if (waitForSelector) {
      await this.waitForElement(waitForSelector);
    }

    const currentUrl = this.page.url();
    console.info(`[AURA/WebActions] ✓ Page loaded: ${currentUrl}`);
  }

  // ─── Core Interactions ───────────────────────────────────────────────────────

  /**
   * Hace click en un elemento usando la resolución semántica de AURA.
   * El target puede ser: "button:Login", "[aria=Submit]", "data-testid", texto libre, etc.
   */
  async click(target: string): Promise<IntentResult> {
    console.info(`[AURA/WebActions] ● click("${target}")`);
    await this.waitForVisualStabilization(BUFFER_MINI);

    if (this.beforeClickHook) {
      await this.beforeClickHook(this.page);
    }

    const result = await this.intentBuilder.on(target).click();
    await this.wait(BUFFER_MINI);
    return result;
  }

  /**
   * Escribe texto en un campo usando resolución semántica.
   * Limpia el campo antes de escribir (comportamiento seguro por defecto).
   */
  async fill(target: string, value: string): Promise<IntentResult> {
    console.info(`[AURA/WebActions] ● fill("${target}", "${value}")`);
    await this.waitForVisualStabilization(BUFFER_MINI);

    const result = await this.intentBuilder.on(target).fill(value);
    await this.wait(BUFFER_MINI);
    return result;
  }

  /**
   * Escribe carácter a carácter (útil para campos con autocompletado).
   */
  async typeSlowly(
    target: string,
    value: string,
    delayMs = 80,
  ): Promise<void> {
    console.info(`[AURA/WebActions] ● typeSlowly("${target}", "${value}")`);
    await this.waitForElement(target);

    const locator = await this.resolveAndHighlight(target, `typeSlowly "${target}"`);
    await locator.clear();

    for (const char of value) {
      await locator.type(char, { delay: delayMs });
    }
    await this.wait(BUFFER_MINI);
  }

  /** Selecciona una opción de un <select> */
  async selectOption(target: string, value: string): Promise<IntentResult> {
    await this.waitForVisualStabilization(BUFFER_MINI);
    return this.intentBuilder.on(target).select(value);
  }

  /** Marca un checkbox */
  async check(target: string): Promise<IntentResult> {
    await this.waitForElement(target);
    return this.intentBuilder.on(target).check();
  }

  /** Desmarca un checkbox */
  async uncheck(target: string): Promise<IntentResult> {
    await this.waitForElement(target);
    return this.intentBuilder.on(target).uncheck();
  }

  /** Hover sobre un elemento */
  async hover(target: string): Promise<IntentResult> {
    await this.waitForElement(target);
    return this.intentBuilder.on(target).hover();
  }

  /** Presiona una tecla sobre un elemento */
  async pressKey(target: string, key: string): Promise<IntentResult> {
    await this.waitForElement(target);
    return this.intentBuilder.on(target).press(key);
  }

  /** Doble click sobre un elemento */
  async doubleClick(target: string): Promise<void> {
    console.info(`[AURA/WebActions] ● doubleClick("${target}")`);
    await this.waitForElement(target);
    const locator = await this.resolveAndHighlight(target, `doubleClick "${target}"`);
    await locator.dblclick();
  }

  /** Click con botón derecho */
  async rightClick(target: string): Promise<void> {
    console.info(`[AURA/WebActions] ● rightClick("${target}")`);
    await this.waitForElement(target);
    const locator = await this.resolveAndHighlight(target, `rightClick "${target}"`);
    await locator.click({ button: 'right' });
  }

  /** Arrastra un elemento hacia otro */
  async dragTo(sourceTarget: string, destTarget: string): Promise<void> {
    console.info(`[AURA/WebActions] ● dragTo("${sourceTarget}" → "${destTarget}")`);
    const source = await this.resolveAndHighlight(sourceTarget, `drag source "${sourceTarget}"`);
    const dest   = await this.resolveAndHighlight(destTarget, `drag target "${destTarget}"`);
    await source.dragTo(dest);
  }

  /** Sube un archivo a un <input type="file"> */
  async uploadFile(target: string, filePath: string | string[]): Promise<void> {
    console.info(`[AURA/WebActions] ● uploadFile("${target}")`);
    await this.waitForElement(target);
    const locator = await this.resolveAndHighlight(target, `uploadFile "${target}"`);
    await locator.setInputFiles(filePath);
  }

  /** Limpia y vacía un campo */
  async clearField(target: string): Promise<IntentResult> {
    console.info(`[AURA/WebActions] ● clearField("${target}")`);
    await this.waitForElement(target);
    return this.intentBuilder.on(target).clear();
  }

  /** Hace scroll hasta un elemento */
  async scrollToElement(target: string): Promise<void> {
    console.info(`[AURA/WebActions] ● scrollToElement("${target}")`);
    const locator = await this.resolveAndHighlight(target, `scrollTo "${target}"`);
    await locator.scrollIntoViewIfNeeded();
  }

  /** Scroll de la página: 'up' | 'down' | número de pixels */
  async scrollPage(direction: 'up' | 'down' | number = 'down'): Promise<void> {
    const pixels = direction === 'up'
      ? -500
      : direction === 'down'
      ? 500
      : direction;

    await this.page.evaluate((px: number) => {
      window.scrollBy({ top: px, behavior: 'smooth' });
    }, pixels);

    await this.wait(300);
  }

  // ─── Assertions ─────────────────────────────────────────────────────────────

  async expectVisible(target: string): Promise<void> {
    console.info(`[AURA/WebActions] ◆ expectVisible("${target}")`);
    await this.intentBuilder.on(target).expect().toBeVisible();
  }

  async expectHidden(target: string): Promise<void> {
    console.info(`[AURA/WebActions] ◆ expectHidden("${target}")`);
    await this.intentBuilder.on(target).expect().toBeHidden();
  }

  async expectEnabled(target: string): Promise<void> {
    console.info(`[AURA/WebActions] ◆ expectEnabled("${target}")`);
    await this.intentBuilder.on(target).expect().toBeEnabled();
  }

  async expectDisabled(target: string): Promise<void> {
    console.info(`[AURA/WebActions] ◆ expectDisabled("${target}")`);
    await this.intentBuilder.on(target).expect().toBeDisabled();
  }

  async expectText(target: string, text: string): Promise<void> {
    console.info(`[AURA/WebActions] ◆ expectText("${target}", "${text}")`);
    await this.intentBuilder.on(target).expect().toHaveText(text);
  }

  async expectValue(target: string, value: string): Promise<void> {
    console.info(`[AURA/WebActions] ◆ expectValue("${target}", "${value}")`);
    await this.intentBuilder.on(target).expect().toHaveValue(value);
  }

  async expectChecked(target: string): Promise<void> {
    console.info(`[AURA/WebActions] ◆ expectChecked("${target}")`);
    await this.intentBuilder.on(target).expect().toBeChecked();
  }

  async expectUrlContains(text: string): Promise<void> {
    const url = this.page.url();
    console.info(`[AURA/WebActions] ◆ expectUrlContains("${text}") — current: "${url}"`);
    if (!url.includes(text)) {
      throw new Error(
        `[AURA/WebActions] Expected URL to contain "${text}" but got "${url}"`,
      );
    }
    console.info(`[AURA/WebActions] ✓ URL contains "${text}"`);
  }

  async expectTitleContains(text: string): Promise<void> {
    const title = await this.page.title();
    console.info(`[AURA/WebActions] ◆ expectTitleContains("${text}") — current: "${title}"`);
    if (!title.includes(text)) {
      throw new Error(
        `[AURA/WebActions] Expected title to contain "${text}" but got "${title}"`,
      );
    }
    console.info(`[AURA/WebActions] ✓ Title contains "${text}"`);
  }

  // ─── Waiting Strategies ──────────────────────────────────────────────────────

  /**
   * Espera estabilización visual COMPLETA de la página.
   * Combina networkidle + domcontentloaded + validación de body visible.
   * Resuelve el problema de screenshots negros en SPA / lazy-loading.
   */
  async waitForVisualLoad(buffer = BUFFER_NAVIGATION): Promise<void> {
    console.info('[AURA/WebActions] Waiting for full visual load...');

    // 1. Red en idle (crucial para SPAs que esperan APIs)
    await this.page
      .waitForLoadState('networkidle', { timeout: TIMEOUT_VISUAL_LOAD })
      .catch(() => {
        console.warn('[AURA/WebActions] networkidle timeout — continuing.');
      });

    // 2. DOM interactivo
    await this.page
      .waitForLoadState('domcontentloaded', { timeout: 10_000 })
      .catch(() => {});

    // 3. Validar body con contenido visible (anti-pantalla-blanca/negra)
    await this.page
      .waitForFunction(
        () => {
          const body = document.body;
          return body !== null
            && body.scrollHeight > 50
            && body.innerText.trim().length > 0;
        },
        { timeout: TIMEOUT_VISUAL_LOAD },
      )
      .catch(() => {
        console.warn('[AURA/WebActions] Body content check timeout — continuing.');
      });

    // 4. Painting buffer final
    if (buffer > 0) {
      console.info(`[AURA/WebActions] Visual buffer: ${buffer}ms`);
      await this.wait(buffer);
    }

    console.info('[AURA/WebActions] ✓ Page visually stable.');
  }

  /**
   * Espera a que UN elemento específico esté estable y con dimensiones válidas.
   * Más ligero que waitForVisualLoad — úsalo para elementos individuales.
   */
  async waitForElement(
    target: string,
    options: WaitForElementOptions = {},
  ): Promise<void> {
    const { state = 'visible', timeout = TIMEOUT_ELEMENT_READY } = options;

    const locator = this.resolveLocator(target);
    await locator.waitFor({ state, timeout });

    // Validar que el elemento tiene dimensiones reales (no display:none recién removido)
    await this.page
      .waitForFunction(
        ([sel]: [string]) => {
          const el = document.querySelector(sel);
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        },
        [target] as [string],
        { timeout: Math.min(timeout, 5_000) },
      )
      .catch(() => {});
  }

  /** Espera estabilización visual ligera (DOM ready + buffer) */
  async waitForVisualStabilization(buffer = BUFFER_ACTION): Promise<void> {
    await this.page
      .waitForLoadState('domcontentloaded', { timeout: 10_000 })
      .catch(() => {});
    if (buffer > 0) await this.wait(buffer);
  }

  /** Espera a que un texto aparezca en la página */
  async waitForText(text: string, timeout = TIMEOUT_ELEMENT_READY): Promise<void> {
    await this.page.waitForSelector(`text=${text}`, { timeout });
  }

  /** Espera a que un URL contenga un string específico */
  async waitForUrl(urlContains: string, timeout = TIMEOUT_ELEMENT_READY): Promise<void> {
    await this.page.waitForURL(`**/*${urlContains}*`, { timeout });
  }

  /** Pausa simple en ms */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  // ─── Visual Debugging ────────────────────────────────────────────────────────

  /**
   * Resalta visualmente un elemento antes de interactuar.
   * Útil para debugging y para generar screenshots claros en reportes.
   */
  async highlightElement(
    selector: string,
    durationMs = 2000,
    color?: string,
  ): Promise<void> {
    const highlightColor = color ?? this.opts.highlightColor;

    await this.page
      .evaluate(
        ({ sel, dur, col }: { sel: string; dur: number; col: string }) => {
          try {
            let el: Element | null = null;

            if (sel.startsWith('//') || sel.startsWith('/')) {
              const result = document.evaluate(
                sel, document, null,
                XPathResult.FIRST_ORDERED_NODE_TYPE, null,
              );
              el = result.singleNodeValue as Element | null;
            } else {
              el = document.querySelector(sel);
            }

            if (el instanceof HTMLElement) {
              const prevShadow  = el.style.boxShadow;
              const prevOutline = el.style.outline;
              const prevZ       = el.style.zIndex;

              el.style.boxShadow = `0 0 0 3px ${col}, 0 0 20px ${col}80`;
              el.style.outline   = `2px solid ${col}`;
              el.style.zIndex    = '9999';

              setTimeout(() => {
                if (el instanceof HTMLElement) {
                  el.style.boxShadow = prevShadow;
                  el.style.outline   = prevOutline;
                  el.style.zIndex    = prevZ;
                }
              }, dur);
            }
          } catch { /* silent */ }
        },
        { sel: selector, dur: durationMs, col: highlightColor },
      )
      .catch(() => {});
  }

  /**
   * Toma un screenshot con espera de estabilización visual previa.
   * Evita capturas en negro.
   */
  async takeScreenshot(
    filePath: string,
    options: ScreenshotOptions = {},
  ): Promise<Buffer> {
    await this.waitForVisualStabilization(this.opts.actionBuffer);

    const buffer = await this.page.screenshot({
      path: filePath,
      fullPage: options.fullPage ?? true,
      clip: options.clip,
      omitBackground: options.omitBackground ?? false,
    });

    console.info(`[AURA/WebActions] 📸 Screenshot saved: ${filePath}`);
    return buffer;
  }

  /**
   * Toma un screenshot como base64 (para incrustar en reportes HTML).
   */
  async takeScreenshotAsBase64(
    options: ScreenshotOptions = {},
  ): Promise<string> {
    await this.waitForVisualStabilization(this.opts.actionBuffer);

    const buffer = await this.page.screenshot({
      fullPage: options.fullPage ?? false,
      clip: options.clip,
      omitBackground: options.omitBackground ?? false,
    });

    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  // ─── Data Extraction ─────────────────────────────────────────────────────────

  /** Lee el texto visible de un elemento */
  async getText(target: string): Promise<string> {
    await this.waitForElement(target);
    return (await this.resolveLocator(target).textContent()) ?? '';
  }

  /** Lee el valor de un input */
  async getValue(target: string): Promise<string> {
    await this.waitForElement(target);
    return this.resolveLocator(target).inputValue();
  }

  /** Verifica si un elemento existe en el DOM */
  async exists(target: string): Promise<boolean> {
    return (await this.resolveLocator(target).count()) > 0;
  }

  /** Verifica si un elemento es visible */
  async isVisible(target: string): Promise<boolean> {
    return this.resolveLocator(target).isVisible();
  }

  /** Devuelve la URL actual */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /** Devuelve el título actual */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /** Acepta un dialog (alert/confirm/prompt) */
  async acceptDialog(promptText?: string): Promise<void> {
    this.page.once('dialog', async (dialog) => {
      await dialog.accept(promptText);
    });
  }

  /** Rechaza un dialog */
  async dismissDialog(): Promise<void> {
    this.page.once('dialog', async (dialog) => {
      await dialog.dismiss();
    });
  }

  // ─── Page Actions ─────────────────────────────────────────────────────────────

  /** Recarga la página */
  async reload(waitForLoad = true): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    if (waitForLoad) await this.waitForVisualLoad(this.opts.navigationBuffer);
  }

  /** Navega hacia atrás */
  async goBack(): Promise<void> {
    await this.page.goBack({ waitUntil: 'domcontentloaded' });
    await this.waitForVisualStabilization();
  }

  /** Navega hacia adelante */
  async goForward(): Promise<void> {
    await this.page.goForward({ waitUntil: 'domcontentloaded' });
    await this.waitForVisualStabilization();
  }

  /** Ejecuta JavaScript directamente en la página */
  async evaluate<T>(script: string): Promise<T> {
    return this.page.evaluate(script) as Promise<T>;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  /**
   * Highlights an element using Playwright Locator API.
   * Works with any locator (CSS, XPath, role, text, getByRole result, etc.)
   */
  private async highlightWithLocator(locator: Locator, action: string): Promise<void> {
    if (!this.opts.highlightOnAction) return;
    try {
      if ((await locator.count()) === 0) return;
      const col = this.opts.highlightColor;
      const lbl = `SAI \u25B8 ${action}`;
      console.info(`[AURA/Highlight] \u2726 Highlighting → ${action}`);

      await locator.first().evaluate(
        (el, opts) => {
          const h = el as HTMLElement;
          const prev = {
            boxShadow: h.style.boxShadow,
            outline: h.style.outline,
            zIndex: h.style.zIndex,
          };
          h.style.boxShadow = `0 0 0 3px ${opts.col}, 0 0 20px ${opts.col}80`;
          h.style.outline = `2px solid ${opts.col}`;
          h.style.zIndex = '9999';
          h.scrollIntoView({ block: 'center', behavior: 'smooth' });

          const tag = document.createElement('div');
          tag.textContent = opts.lbl;
          Object.assign(tag.style, {
            position: 'fixed',
            top: `${Math.max(4, h.getBoundingClientRect().top - 30)}px`,
            left: `${h.getBoundingClientRect().left}px`,
            background: opts.col,
            color: '#fff',
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            zIndex: '10000',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          });
          document.body.appendChild(tag);

          setTimeout(() => {
            h.style.boxShadow = prev.boxShadow;
            h.style.outline = prev.outline;
            h.style.zIndex = prev.zIndex;
            tag.remove();
          }, opts.dur);
        },
        { col, lbl, dur: 1500 },
      );

      await this.wait(500);
    } catch { /* non-critical: highlight must never break the flow */ }
  }

  /** Resolves target to Locator and highlights it in one step */
  private async resolveAndHighlight(target: string, action: string): Promise<Locator> {
    const locator = this.resolveLocator(target);
    await this.highlightWithLocator(locator, action);
    return locator;
  }

  /**
   * Resuelve un target a un Locator de Playwright.
   * Soporta selectores CSS, XPath, texto, y atributos AURA.
   */
  private resolveLocator(target: string): Locator {
    if (target.startsWith('//') || target.startsWith('/')) {
      return this.page.locator(`xpath=${target}`);
    }

    // AURA semantic syntax: "button:Login" → getByRole
    const semanticMatch = /^(\w+):(.+)$/.exec(target);
    if (semanticMatch) {
      const [, role, name] = semanticMatch;
      const playwrightRoles = [
        'button', 'link', 'checkbox', 'radio', 'textbox',
        'combobox', 'listbox', 'option', 'menuitem', 'tab',
        'heading', 'img', 'row', 'cell', 'gridcell',
      ];
      if (playwrightRoles.includes(role.toLowerCase())) {
        return this.page.getByRole(
          role.toLowerCase() as Parameters<typeof this.page.getByRole>[0],
          { name, exact: false },
        );
      }
    }

    // ARIA syntax: "[aria=Label]"
    const ariaMatch = /^\[aria=(.+)\]$/.exec(target);
    if (ariaMatch) {
      return this.page.locator(`[aria-label="${ariaMatch[1]}"]`);
    }

    // Fallback: CSS / data-testid / text
    return this.page.locator(target);
  }
}
