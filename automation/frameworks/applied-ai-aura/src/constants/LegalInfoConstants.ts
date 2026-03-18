/**
 * AURA — Legal Information Page Constants (SAIAPP3-14)
 *
 * Legal page path and selectors for the TuCreditoOnline public site.
 * Base URL is provided by AURA_TARGET_URL when running against PR preview.
 */
export const LegalInfoConstants = {
  /** Public route for the Legal Information / Aviso legal page */
  LEGAL_PATH: '/legal',

  /** Minimum number of content sections (h2) required on the legal page (AC4) */
  MIN_CONTENT_SECTIONS: 3,

  /** Link text in header (i18n: header.legalInfo) — any of these per locale */
  HEADER_LINK_TEXTS: ['Información legal', 'Legal Information', 'Informação Legal'] as const,

  /** Link text in footer (i18n: footer.legalNotice) */
  FOOTER_LINK_TEXTS: ['Aviso Legal', 'Legal Notice'] as const,

  /** Possible page titles (i18n: legalPage.title) for assertion */
  PAGE_TITLE_TEXTS: ['Información Legal', 'Legal Information', 'Informação Legal'] as const,
} as const;
