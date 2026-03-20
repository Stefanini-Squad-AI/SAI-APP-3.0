/**
 * AURA — LegalInformationConstants
 * Stable text and URL constants for Legal Information page scenarios.
 */
export const LegalInformationConstants = {
  LEGAL_PATH: '/legal',

  get LEGAL_URL() {
    return `${process.env['AURA_TARGET_URL'] ?? 'http://localhost:5173'}${LegalInformationConstants.LEGAL_PATH}`;
  },

  // Navigation labels
  NAV_LINK_TEXT_EN: 'Legal Information',
  FOOTER_LINK_TEXT_EN: 'Legal Notice',

  // Page heading
  HEADING_EN: 'Legal Information',

  // Section headings — English
  SECTION_REGULATORY_EN: 'Regulatory Framework',
  SECTION_IP_EN: 'Intellectual Property',
  SECTION_LIABILITY_EN: 'Limitation of Liability',
  SECTION_LAW_EN: 'Governing Law',

  // Section headings — Spanish
  SECTION_REGULATORY_ES: 'Marco Regulatorio',
  SECTION_IP_ES: 'Propiedad Intelectual',
  SECTION_LIABILITY_ES: 'Limitación de Responsabilidad',
  SECTION_LAW_ES: 'Ley Aplicable',

  // Section headings — Portuguese
  SECTION_REGULATORY_PT: 'Marco Regulatório',
  SECTION_IP_PT: 'Propriedade Intelectual',
  SECTION_LIABILITY_PT: 'Limitação de Responsabilidade',
  SECTION_LAW_PT: 'Lei Aplicável',

  // Language selector labels
  LANG_ES: 'Español',
  LANG_PT: 'Português',
} as const;
