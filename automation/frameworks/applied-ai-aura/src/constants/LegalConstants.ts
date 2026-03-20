/**
 * AURA — Legal Constants
 *
 * RULE: Each constants file defines its own URLs.
 *       AURA_TARGET_URL from env is the PR preview base URL.
 *       Text constants reflect stable visible strings used in assertions.
 */
export const LegalConstants = {
  BASE_URL:    process.env['AURA_TARGET_URL'] ?? 'http://localhost:5173',
  LEGAL_PATH:  '/legal',

  get LEGAL_URL() { return `${LegalConstants.BASE_URL}${LegalConstants.LEGAL_PATH}`; },

  // Visible heading texts per locale
  HEADING_ES:  'Informaciones Legales',
  HEADING_EN:  'Legal Information',
  HEADING_PT:  'Informações Legais',

  // Tab labels per locale
  TABS_ES: {
    LEGAL_NOTICE: 'Aviso Legal',
    PRIVACY:      'Política de Privacidad',
    TERMS:        'Términos y Condiciones',
  },
  TABS_EN: {
    LEGAL_NOTICE: 'Legal Notice',
    PRIVACY:      'Privacy Policy',
    TERMS:        'Terms and Conditions',
  },
  TABS_PT: {
    LEGAL_NOTICE: 'Aviso Legal',
    PRIVACY:      'Política de Privacidade',
    TERMS:        'Termos e Condições',
  },

  // Header and footer navigation targets
  HEADER_LINK_LABEL: 'Legal',
  FOOTER_LINK_LABEL: 'Aviso Legal',
} as const;
