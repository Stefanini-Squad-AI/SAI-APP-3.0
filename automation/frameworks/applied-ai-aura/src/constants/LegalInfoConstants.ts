export const LegalInfoConstants = {
  BASE_URL: process.env['AURA_TARGET_URL'] ?? 'http://localhost:5173',
  LEGAL_INFO_PATH: '/legal-info',

  get LEGAL_INFO_URL() {
    return `${LegalInfoConstants.BASE_URL}${LegalInfoConstants.LEGAL_INFO_PATH}`;
  },

  // Page and section text in Spanish
  PAGE_TITLE_ES: 'Información Legal',
  SECTION_GENERAL_ES: 'Información General',
  SECTION_DATA_PROTECTION_ES: 'Protección de Datos',
  SECTION_INTELLECTUAL_PROPERTY_ES: 'Propiedad Intelectual',
  SECTION_CONTACT_ES: 'Contacto para Consultas Legales',

  // Page and section text in English
  PAGE_TITLE_EN: 'Legal Information',
  SECTION_GENERAL_EN: 'General Information',
  SECTION_DATA_PROTECTION_EN: 'Data Protection',
  SECTION_INTELLECTUAL_PROPERTY_EN: 'Intellectual Property',
  SECTION_CONTACT_EN: 'Contact for Legal Inquiries',

  // Page and section text in Portuguese
  PAGE_TITLE_PT: 'Informações Legais',
  SECTION_GENERAL_PT: 'Informações Gerais',
  SECTION_DATA_PROTECTION_PT: 'Proteção de Dados',
  SECTION_INTELLECTUAL_PROPERTY_PT: 'Propriedade Intelectual',
  SECTION_CONTACT_PT: 'Contato para Consultas Legais',

  // UI elements
  FOOTER_LEGAL_INFORMATION_LINK: 'Información Legal',
  BACK_HOME_LINK: 'Volver al Inicio',
  CONTACT_US_BUTTON: 'Contáctanos',
} as const;
