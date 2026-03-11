/**
 * Step definitions for the Language Switcher feature.
 */
import { When } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';

const LANGUAGE_LABELS: Record<string, string[]> = {
  english:    ['English', 'Inglés', 'Inglês'],
  spanish:    ['Español', 'Spanish', 'Espanhol'],
  portuguese: ['Português', 'Portuguese', 'Portugués'],
  inglés:     ['English', 'Inglés', 'Inglês'],
  inglês:     ['English', 'Inglés', 'Inglês'],
  español:    ['Español', 'Spanish', 'Espanhol'],
  espanhol:   ['Español', 'Spanish', 'Espanhol'],
  portugués:  ['Português', 'Portuguese', 'Portugués'],
  português:  ['Português', 'Portuguese', 'Portugués'],
};

When(
  /^I switch the language to (English|Spanish|Portuguese)$|^cambio el idioma a (Inglés|Español|Portugués)$|^mudo o idioma para (Inglês|Espanhol|Português)$/,
  async function (this: AuraWorld, ...args: (string | undefined)[]) {
    const langArg = (args.find(a => a !== undefined) as string).toLowerCase();
    const labels = LANGUAGE_LABELS[langArg] ?? [langArg];

    // Open the language dropdown (next to the admin login button)
    await this.I
      .on('button:has-text("EN"), button:has-text("ES"), button:has-text("PT"), [aria-label*="language" i], [aria-label*="idioma" i], [aria-label*="idioma" i]')
      .click();

    await this.webActions.wait(500);

    // Click the matching language option
    for (const label of labels) {
      try {
        await this.I.on(`[role="option"]:has-text("${label}"), li:has-text("${label}"), button:has-text("${label}")`).click();
        await this.webActions.waitForVisualLoad();
        return;
      } catch {
        // Try next label variant
      }
    }

    throw new Error(`Could not find language option for: ${labels.join(', ')}`);
  }
);
