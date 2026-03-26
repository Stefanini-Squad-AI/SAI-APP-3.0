/**
 * AURA — Browser Factory
 * Centralises browser/context/page lifecycle management.
 * Implements the Factory pattern to abstract Playwright's setup complexity.
 */
import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';
import type { AuraBrowserConfig, BrowserName } from '../../types/index';

type BrowserLauncher = typeof chromium | typeof firefox | typeof webkit;

const LAUNCHERS: Readonly<Record<BrowserName, BrowserLauncher>> = {
  chromium,
  firefox,
  webkit,
};

export class BrowserFactory {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private videoDir: string | undefined;

  constructor(private readonly config: AuraBrowserConfig) {}

  static fromEnv(): BrowserFactory {
    const config: AuraBrowserConfig = {
      browser: (process.env['AURA_BROWSER'] ?? 'chromium') as BrowserName,
      headless: process.env['AURA_HEADLESS'] !== 'false',
      slowMo: Number(process.env['AURA_SLOW_MO'] ?? '0'),
      timeout: Number(process.env['AURA_TIMEOUT'] ?? '30000'),
    };
    return new BrowserFactory(config);
  }

  /** Sets the directory for video recording. Must be called before createContext. */
  setVideoDir(dir: string): void {
    this.videoDir = dir;
  }

  async launchBrowser(): Promise<Browser> {
    const launcher = LAUNCHERS[this.config.browser];
    this.browser = await launcher.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
    });
    return this.browser;
  }

  async createContext(): Promise<BrowserContext> {
    if (!this.browser) await this.launchBrowser();

    const viewport = this.config.viewport ?? { width: 1280, height: 800 };
    const recordVideo = process.env['AURA_RECORD_VIDEO'] === 'true' && this.videoDir
      ? { dir: this.videoDir, size: viewport }
      : undefined;

    this.context = await this.browser!.newContext({
      viewport,
      recordVideo,
    });
    this.context.setDefaultTimeout(this.config.timeout);
    return this.context;
  }

  async createPage(): Promise<Page> {
    if (!this.context) await this.createContext();
    return this.context!.newPage();
  }

  async teardown(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
    this.context = null;
    this.browser = null;
  }
}
