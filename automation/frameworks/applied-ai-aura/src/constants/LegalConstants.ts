/**
 * AURA — Legal Information Page constants
 *
 * URL base: uses `AURA_TARGET_URL` from .env (single variable for local env by default).
 * Default local: http://localhost:3000 (Vite dev server).
 */
const DEFAULT_LOCAL = 'http://localhost:3000';

function resolveBaseUrl(): string {
  const target = process.env['AURA_TARGET_URL']?.trim();
  if (target) return target.replace(/\/$/, '');
  return DEFAULT_LOCAL;
}

export const LegalConstants = {
  BASE_URL: resolveBaseUrl(),

  LEGAL_PATH: '/legal',
  get LEGAL_URL(): string {
    const b = LegalConstants.BASE_URL.replace(/\/$/, '');
    return `${b}${LegalConstants.LEGAL_PATH}`;
  },

  PAGE_TITLE: 'Legal Information',
} as const;
