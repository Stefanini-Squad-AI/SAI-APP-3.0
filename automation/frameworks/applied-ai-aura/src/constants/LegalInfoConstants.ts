/**
 * AURA — Legal Info Constants
 * Routes and selectors for the Legal Information page (/legal-info).
 * Base URL comes from AURA_TARGET_URL (PR preview) when running in CI.
 */
function getBaseUrl(): string {
  const url = process.env['AURA_TARGET_URL'];
  if (url) {
    return url.replace(/\/$/, '');
  }
  return 'http://localhost:5173';
}

export const LegalInfoConstants = {
  LEGAL_INFO_PATH: '/legal-info',
  CONTACT_PATH: '/contact',
  get BASE_URL(): string {
    return getBaseUrl();
  },
  get LEGAL_INFO_URL(): string {
    return `${getBaseUrl()}${LegalInfoConstants.LEGAL_INFO_PATH}`;
  },
  /** Link text in header/footer (i18n): Spanish */
  LINK_TEXT_ES: 'Información legal',
  /** Link text in header/footer (i18n): English */
  LINK_TEXT_EN: 'Legal Information',
  /** Link text in header/footer (i18n): Portuguese */
  LINK_TEXT_PT: 'Informação Legal',
  /** Page title (i18n) when content is loaded - used for visibility assertion */
  PAGE_TITLE_SELECTOR: 'h1',
} as const;
