/**
 * AURA — Legal information page (public /legal-info)
 * Selectors and expected copy aligned with frontend i18n (en, es, pt).
 */

export const LegalInfoConstants = {
  LEGAL_INFO_PATH: '/legal-info',
  CONTACT_PATH: '/contact',

  SELECTOR_NAV_DESKTOP: '[data-testid="nav-legal-info-desktop"]',
  SELECTOR_NAV_MOBILE: '[data-testid="nav-legal-info-mobile"]',
  SELECTOR_FOOTER_LINK: '[data-testid="footer-legal-info"]',
  SELECTOR_PAGE_TITLE: '[data-testid="legal-info-title"]',
  SELECTOR_SECTION_1_TITLE: '[data-testid="legal-info-s1-title"]',
  SELECTOR_CONTACT_CTA: '[data-testid="legal-info-contact-link"]',
  SELECTOR_LANG_BUTTON: '[data-testid="language-selector-button"]',
  SELECTOR_LANG_ES: '[data-testid="language-option-es"]',
  SELECTOR_LANG_PT: '[data-testid="language-option-pt"]',
  SELECTOR_MOBILE_MENU_TOGGLE: '[data-testid="mobile-menu-toggle"]',

  TITLE_EN: 'Legal information',
  TITLE_ES: 'Información legal',
  TITLE_PT: 'Informações legais',

  SECTION_1_EN: 'Corporate name',
  SECTION_1_ES: 'Denominación social',
  SECTION_1_PT: 'Denominação social',
} as const;

function requirePreviewBase(): string {
  const base = process.env['AURA_TARGET_URL'];
  if (!base) {
    throw new Error('AURA_TARGET_URL is not defined. Configure the preview URL before running tests.');
  }
  return base.replace(/\/$/, '');
}

export function legalInfoAbsoluteUrl(): string {
  return `${requirePreviewBase()}${LegalInfoConstants.LEGAL_INFO_PATH}`;
}
