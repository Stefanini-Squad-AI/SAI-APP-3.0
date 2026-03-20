/**
 * AURA — LegalInfo Constants
 *
 * RULE: Use AURA_TARGET_URL for @preview scenarios (PR preview deployments).
 *       Text constants are used only for values asserted in scenarios.
 */
export const LegalInfoConstants = {
  BASE_URL:   process.env['AURA_TARGET_URL'] ?? 'http://localhost:5173',
  LEGAL_PATH: '/legal',

  get LEGAL_URL() { return `${LegalInfoConstants.BASE_URL}${LegalInfoConstants.LEGAL_PATH}`; },

  HEADING_EN:             'Legal Information',
  HEADING_ES:             'Información Legal',
  HEADING_PT:             'Informações Legais',

  SECTION_REGULATORY_EN:  'Regulatory Framework',
  SECTION_REGULATORY_ES:  'Marco Regulatorio',
  SECTION_REGULATORY_PT:  'Marco Regulatório',

  SECTION_LIABILITY_EN:   'Liability Disclaimer',
  SECTION_LAW_EN:         'Applicable Law',
  SECTION_INQUIRIES_EN:   'Legal Inquiries',

  NAV_LABEL_EN:           'Legal',
  FOOTER_LABEL_EN:        'Legal Information',
} as const;
