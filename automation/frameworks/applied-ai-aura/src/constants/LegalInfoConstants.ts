/**
 * AURA — LegalInfo Constants
 *
 * RULE: Each constants file defines its own URLs.
 *       AURA_TARGET_URL from env is the preview URL base for @preview scenarios.
 *       Text constants correspond to visible UI strings asserted in scenarios.
 */
export const LegalInfoConstants = {
  BASE_URL:        process.env['AURA_TARGET_URL'] ?? 'http://localhost:5173',
  LEGAL_INFO_PATH: '/informacion-legal',
  CONTACT_PATH:    '/contact',

  get LEGAL_INFO_URL() { return `${LegalInfoConstants.BASE_URL}${LegalInfoConstants.LEGAL_INFO_PATH}`; },

  // Stable UI text used in assertions
  NAV_LABEL:             'Información Legal',
  CONTACT_NAV_LABEL:     'Contacto',
  PAGE_HERO_TITLE:       'Información Legal',
  SECTION_TERMS:         'Términos y Condiciones',
  SECTION_PRIVACY:       'Política de Privacidad',
  SECTION_LEGAL_NOTICE:  'Aviso Legal',
} as const;
