/**
 * AURA — Legal Page (TuCreditoOnline) constants
 *
 * URL base: uses `AURA_TARGET_URL` from .env (single variable for default local environment).
 * Default local: http://localhost:3000 (Vite / frontend Docker).
 */
const DEFAULT_LOCAL = 'http://localhost:3000';

function resolveBaseUrl(): string {
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

  PAGE_TITLE_ES: 'Aviso Legal',
  PAGE_TITLE_EN: 'Legal Notice',
  PAGE_TITLE_PT: 'Aviso Legal',

  NAV_LABEL_ES: 'Aviso Legal',
  NAV_LABEL_EN: 'Legal Information',
  NAV_LABEL_PT: 'Aviso Legal',

  CONTACT_LINK: '/contact',
} as const;
