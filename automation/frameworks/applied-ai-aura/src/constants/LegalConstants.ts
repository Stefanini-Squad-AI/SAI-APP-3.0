/**
 * AURA — Legal Page constants
 *
 * URL base: uses `AURA_TARGET_URL` from .env (single variable for default local environment).
 * Compatibility: if `AURA_LEGAL_BASE_URL` exists, it takes priority over default.
 * Default local: http://localhost:3000 (Vite / Docker frontend).
 */
const DEFAULT_LOCAL = 'http://localhost:3000';

function resolveBaseUrl(): string {
  const legacy = process.env['AURA_LEGAL_BASE_URL']?.trim();
  if (legacy) return legacy.replace(/\/$/, '');
  const target = process.env['AURA_TARGET_URL']?.trim();
  if (target) return target.replace(/\/$/, '');
  return DEFAULT_LOCAL.replace(/\/$/, '');
}

export const LegalConstants = {
  BASE_URL: resolveBaseUrl(),

  get LEGAL_PATH(): string {
    return '/legal';
  },

  get LEGAL_URL(): string {
    const b = LegalConstants.BASE_URL.replace(/\/$/, '');
    return `${b}${LegalConstants.LEGAL_PATH}`;
  },

  PAGE_TITLE: 'Legal Information',
  PAGE_TITLE_ES: 'Información Legal',
  PAGE_TITLE_PT: 'Informação Legal',

  NAV_LABEL: 'Legal Information',
  NAV_LABEL_ES: 'Información Legal',
  NAV_LABEL_PT: 'Informação Legal',

  SECTION_HEADING_1: '1. Legal Notices',
  SECTION_HEADING_2: '2. Regulatory Compliance',
  SECTION_HEADING_3: '3. Intellectual Property',
  SECTION_HEADING_4: '4. Disclaimer of Warranties',
  SECTION_HEADING_5: '5. References and Related Policies',
} as const;
