/**
 * AURA — Legal Constants
 *
 * RULE: Each constants file defines its own URLs.
 *       AURA_TARGET_URL from .env is the PR preview base for @preview scenarios.
 */
export const LegalConstants = {
  BASE_URL:     process.env['AURA_TARGET_URL'] ?? 'http://localhost:5173',
  LEGAL_PATH:   '/legal',
  PRIVACY_PATH: '/privacy',
  TERMS_PATH:   '/terms',
  CONTACT_PATH: '/contact',

  get LEGAL_URL()   { return `${LegalConstants.BASE_URL}${LegalConstants.LEGAL_PATH}`; },
  get PRIVACY_URL()  { return `${LegalConstants.BASE_URL}${LegalConstants.PRIVACY_PATH}`; },
  get TERMS_URL()    { return `${LegalConstants.BASE_URL}${LegalConstants.TERMS_PATH}`; },
  get CONTACT_URL()  { return `${LegalConstants.BASE_URL}${LegalConstants.CONTACT_PATH}`; },
} as const;
