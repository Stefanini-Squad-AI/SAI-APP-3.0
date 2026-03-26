/**
 * AURA — Legal Information Page Constants
 *
 * URL base: usa `AURA_TARGET_URL` del .env (única variable para entorno local por defecto).
 * Compatibilidad: si existe `AURA_LEGAL_BASE_URL`, tiene prioridad sobre el default.
 * Por defecto local: http://localhost:3000 (Vite / Docker del frontend).
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
  LEGAL_PATH: '/legal',

  get LEGAL_URL(): string {
    const b = LegalConstants.BASE_URL.replace(/\/$/, '');
    return `${b}${LegalConstants.LEGAL_PATH}`;
  },

  // Page content identifiers
  PAGE_TITLE: 'Legal Information',
  SECTION_HEADING_1: '1. Legal Disclaimer',
  SECTION_HEADING_2: '2. Regulatory Compliance',
  SECTION_HEADING_3: '3. Liability Disclaimer',
  SECTION_HEADING_4: '4. Intellectual Property',
} as const;

