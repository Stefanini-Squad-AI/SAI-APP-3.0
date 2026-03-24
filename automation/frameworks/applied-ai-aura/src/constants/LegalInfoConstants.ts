/**
 * AURA — LegalInfo Constants
 *
 * RULE: Each constants file defines its own URLs.
 *       AURA_TARGET_URL from .env is the preview base for @preview scenarios.
 */
export const LegalInfoConstants = {
  BASE_URL:   process.env['AURA_TARGET_URL'] ?? 'http://localhost:5173',
  LEGAL_PATH: '/legal',
  HOME_PATH:  '/',

  get LEGAL_URL() { return `${LegalInfoConstants.BASE_URL}${LegalInfoConstants.LEGAL_PATH}`; },
  get HOME_URL()  { return `${LegalInfoConstants.BASE_URL}${LegalInfoConstants.HOME_PATH}`; },

  NAV_LABEL:        'Información Legal',
  FOOTER_LABEL:     'Aviso Legal',
  SECTION_LEGAL:    'Aviso Legal',
  SECTION_LIABILITY: 'Limitación de Responsabilidad',
} as const;
