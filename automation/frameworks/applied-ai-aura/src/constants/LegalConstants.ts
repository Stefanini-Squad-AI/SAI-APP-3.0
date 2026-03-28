/**
 * AURA — Legal Page Constants
 * Test URLs and selectors for the Legal Information page.
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
  get LEGAL_URL() {
    return `${LegalConstants.BASE_URL}${LegalConstants.LEGAL_PATH}`;
  },
  PAGE_TITLE: 'Legal Information',
  HERO_HEADING: 'Legal Information',
  SECTION1_HEADING: '1. Legal Notice',
  SECTION2_HEADING: '2. Limitation of Liability',
  SECTION3_HEADING: '3. Additional Legal Information',
  PRIVACY_LINK: 'Privacy Policy',
  TERMS_LINK: 'Terms and Conditions',
  BACK_HOME_LINK: 'Back to Home',
} as const;
