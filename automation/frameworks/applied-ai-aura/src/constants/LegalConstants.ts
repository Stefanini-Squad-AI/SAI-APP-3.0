/**
 * AURA — Legal constants
 *
 * URL base: uses `AURA_TARGET_URL` from .env (defaults to local dev server).
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
  LEGAL_PATH: '/legal',

  get LEGAL_URL(): string {
    return `${LegalConstants.BASE_URL}${LegalConstants.LEGAL_PATH}`;
  },

  PAGE_TITLE: 'Legal Notice',
  SECTION_1_TITLE: '1. Company Information',
} as const;
