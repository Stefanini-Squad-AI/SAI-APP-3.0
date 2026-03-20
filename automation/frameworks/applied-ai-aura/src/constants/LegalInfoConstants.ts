/**
 * AURA — LegalInfo Constants
 *
 * RULE: Each constants file defines its own URLs and selectors.
 *       AURA_TARGET_URL from .env is the preview base; paths are appended at runtime.
 */
export const LegalInfoConstants = {
  LEGAL_INFO_PATH: '/legal-info',
  PRIVACY_PATH:    '/privacy',
  TERMS_PATH:      '/terms',

  get LEGAL_INFO_URL() {
    const base = (process.env['AURA_TARGET_URL'] ?? '').replace(/\/$/, '');
    return `${base}${LegalInfoConstants.LEGAL_INFO_PATH}`;
  },

  // Expected translated texts per locale
  HEADER_LINK_TEXT: {
    es: 'Información Legal',
    en: 'Legal Information',
    pt: 'Informações Legais',
  },

  HERO_TITLE_TEXT: {
    es: 'Información Legal',
    en: 'Legal Information',
    pt: 'Informações Legais',
  },

  SECTIONS: {
    es: ['Aviso Legal', 'Marco Regulatorio', 'Jurisdicción y Ley Aplicable', 'Derechos del Usuario', 'Limitación de Responsabilidad'],
    en: ['Legal Notice', 'Regulatory Framework', 'Jurisdiction and Applicable Law', 'User Rights', 'Limitation of Liability'],
    pt: ['Aviso Legal', 'Marco Regulatório', 'Jurisdição e Lei Aplicável', 'Direitos do Usuário', 'Limitação de Responsabilidade'],
  },

  LANGUAGE_SELECTOR: 'select[aria-label], select',
  LANGUAGE_VALUES: { es: 'es', en: 'en', pt: 'pt' },

  FOOTER_LEGAL_NOTICE_TEXT: {
    es: 'Aviso Legal',
    en: 'Legal Notice',
    pt: 'Aviso Legal',
  },
} as const;
