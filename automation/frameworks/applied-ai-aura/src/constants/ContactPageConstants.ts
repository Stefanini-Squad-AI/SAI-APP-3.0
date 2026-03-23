/**
 * AURA — ContactPage Constants
 * Stable UI text and paths for Contact page testing.
 */

export const ContactPageConstants = {
  BASE_URL: process.env['AURA_TARGET_URL'] ?? 'http://localhost:5173',
  CONTACT_PATH: '/contact',

  get CONTACT_URL() {
    return `${ContactPageConstants.BASE_URL}${ContactPageConstants.CONTACT_PATH}`;
  },

  // Tab labels
  TAB_CONTACT: 'Contacto',
  TAB_LEGAL_INFO: 'Información Legal',

  // Tab labels (English)
  TAB_CONTACT_EN: 'Contact',
  TAB_LEGAL_INFO_EN: 'Legal Information',

  // Tab labels (Portuguese)
  TAB_CONTACT_PT: 'Contato',
  TAB_LEGAL_INFO_PT: 'Informações Legais',

  // Legal section headers
  LEGAL_TERMS_TITLE_ES: 'Términos y Condiciones',
  LEGAL_PRIVACY_TITLE_ES: 'Política de Privacidad',
  LEGAL_REGULATORY_TITLE_ES: 'Información de Regulación',

  // Legal section headers (English)
  LEGAL_TERMS_TITLE_EN: 'Terms and Conditions',
  LEGAL_PRIVACY_TITLE_EN: 'Privacy Policy',
  LEGAL_REGULATORY_TITLE_EN: 'Regulatory Information',

  // Legal section headers (Portuguese)
  LEGAL_TERMS_TITLE_PT: 'Termos e Condições',
  LEGAL_PRIVACY_TITLE_PT: 'Política de Privacidade',
  LEGAL_REGULATORY_TITLE_PT: 'Informação Regulatória',

  // Form labels
  FORM_TITLE: 'Send us a Message',
  FORM_TITLE_ES: 'Envíanos un Mensaje',
  FORM_TITLE_EN: 'Send us a Message',
  FORM_TITLE_PT: 'Envie-nos uma Mensagem',

  // Contact info section
  CONTACT_INFO_TITLE: 'Contact Information',
  CONTACT_INFO_TITLE_ES: 'Información de Contacto',
  CONTACT_INFO_TITLE_EN: 'Contact Information',
  CONTACT_INFO_TITLE_PT: 'Informações de Contato',

  // Location section
  LOCATION_TITLE: 'Our Location',
  LOCATION_TITLE_ES: 'Nuestra Ubicación',
  LOCATION_TITLE_EN: 'Our Location',
  LOCATION_TITLE_PT: 'Nossa Localização',
} as const;
