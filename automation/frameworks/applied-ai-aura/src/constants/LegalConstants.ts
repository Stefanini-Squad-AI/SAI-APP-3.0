/**
 * AURA — Legal Constants
 *
 * Routes, expected titles and navigation labels for the Legal Information page (SAIAPP3-21).
 * Target URL is provided at runtime via AURA_TARGET_URL environment variable.
 */
export const LegalConstants = {
  LEGAL_PATH: '/legal',

  get LEGAL_URL(): string {
    const base = process.env['AURA_TARGET_URL'] ?? '';
    return `${base}${LegalConstants.LEGAL_PATH}`;
  },

  TITLES: {
    es: 'Información Legal',
    en: 'Legal Information',
    pt: 'Informação Legal',
  } as const,

  NAV_LABEL: 'Legal',

  FOOTER_LINK_TEXT: {
    es: 'Aviso Legal',
    en: 'Legal Notice',
    pt: 'Aviso Legal',
  } as const,

  MIN_H2_SECTIONS: 4,

  SECTION_KEYS: [
    'Aviso Legal',
    'Limitación de Responsabilidad',
    'Propiedad Intelectual',
    'Jurisdicción',
  ] as const,
} as const;
