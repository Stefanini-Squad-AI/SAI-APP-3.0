/**
 * AURA — Legal information page (public /legal route).
 */
export const LegalInfoConstants = {
  BASE_URL: process.env['AURA_TARGET_URL'] ?? 'http://localhost:5173',
  LEGAL_PATH: '/legal',
  get LEGAL_INFO_URL(): string {
    return `${LegalInfoConstants.BASE_URL.replace(/\/$/, '')}${LegalInfoConstants.LEGAL_PATH}`;
  },
  /** English (default preview) — assertions */
  NAV_LABEL_EN: 'Legal Information',
  TITLE_EN: 'Legal Information',
  NAV_LABEL_ES: 'Información legal',
  TITLE_ES: 'Información legal',
  TITLE_PT: 'Informações legais',
  CONTACT_LABEL_EN: 'Contact',
} as const;
