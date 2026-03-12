/**
 * AURA — DOM Extractor
 * Extracts a lightweight, AI-friendly representation of the current page DOM.
 * Focuses on interactive elements and ARIA semantics — not raw HTML —
 * to keep token usage minimal and precision high.
 */
import type { Page } from 'playwright';

export interface DOMElement {
  readonly tag: string;
  readonly role: string | null;
  readonly name: string | null;
  readonly placeholder: string | null;
  readonly testId: string | null;
  readonly text: string | null;
  readonly id: string | null;
  readonly type: string | null;
  readonly value: string | null;
  readonly disabled: boolean;
  readonly visible: boolean;
}

export interface DOMSnapshot {
  readonly url: string;
  readonly title: string;
  readonly elements: readonly DOMElement[];
  readonly capturedAt: string;
}

const INTERACTIVE_TAGS = [
  'a', 'button', 'input', 'select', 'textarea',
  'label', 'form', 'option', 'details', 'summary',
];

const LANDMARK_ROLES = [
  'button', 'link', 'checkbox', 'radio', 'textbox',
  'combobox', 'listbox', 'option', 'menuitem', 'tab',
  'heading', 'banner', 'navigation', 'main', 'dialog',
];

export class DOMExtractor {
  async extract(page: Page): Promise<DOMSnapshot> {
    const url = page.url();
    const title = await page.title();

    const elements = await page.evaluate(
      ({ tags, roles }: { tags: string[]; roles: string[] }): DOMElement[] => {
        const selector = tags.join(', ') + ', [role]';
        const nodes = Array.from(document.querySelectorAll(selector));

        return nodes.slice(0, 150).map((el): DOMElement => {
          const htmlEl = el as HTMLElement;
          const inputEl = el instanceof HTMLInputElement ? el : null;

          const computedRole = el.getAttribute('role')
            ?? el.tagName.toLowerCase();

          const isLandmark = roles.includes(computedRole.toLowerCase());
          const isInteractive = tags.includes(el.tagName.toLowerCase());

          if (!isLandmark && !isInteractive) {
            return {
              tag: el.tagName.toLowerCase(),
              role: null,
              name: null,
              placeholder: null,
              testId: null,
              text: null,
              id: null,
              type: null,
              value: null,
              disabled: false,
              visible: false,
            };
          }

          return {
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute('role') ?? el.tagName.toLowerCase(),
            name:
              el.getAttribute('aria-label') ??
              el.getAttribute('aria-labelledby') ??
              (el as HTMLElement).innerText?.trim().slice(0, 80) ??
              null,
            placeholder: el.getAttribute('placeholder'),
            testId:
              el.getAttribute('data-testid') ??
              el.getAttribute('data-cy') ??
              null,
            text: htmlEl.innerText?.trim().slice(0, 80) ?? null,
            id: el.getAttribute('id'),
            type: el.getAttribute('type'),
            value: inputEl?.value ?? el.getAttribute('value') ?? null,
            disabled: htmlEl.hasAttribute('disabled'),
            visible:
              htmlEl.offsetWidth > 0 &&
              htmlEl.offsetHeight > 0 &&
              getComputedStyle(htmlEl).visibility !== 'hidden',
          };
        }).filter((el): boolean => el.visible);
      },
      { tags: INTERACTIVE_TAGS, roles: LANDMARK_ROLES },
    );

    return {
      url,
      title,
      elements: elements.filter((e) => e.role !== null),
      capturedAt: new Date().toISOString(),
    };
  }

  /** Serialises a snapshot into a compact string for the AI prompt */
  static format(snapshot: DOMSnapshot): string {
    const lines = snapshot.elements.map((el) => {
      const parts: string[] = [`<${el.tag}`];
      if (el.role) parts.push(`role="${el.role}"`);
      if (el.type) parts.push(`type="${el.type}"`);
      if (el.id) parts.push(`id="${el.id}"`);
      if (el.name) parts.push(`aria-label="${el.name}"`);
      if (el.placeholder) parts.push(`placeholder="${el.placeholder}"`);
      if (el.testId) parts.push(`data-testid="${el.testId}"`);
      if (el.text && el.text !== el.name) parts.push(`text="${el.text}"`);
      if (el.disabled) parts.push('disabled');
      return parts.join(' ') + ' />';
    });

    return `URL: ${snapshot.url}\nTitle: ${snapshot.title}\n\nDOM:\n${lines.join('\n')}`;
  }
}
