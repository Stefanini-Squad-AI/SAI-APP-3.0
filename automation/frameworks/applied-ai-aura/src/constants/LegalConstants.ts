/**
 * AURA — LegalConstants
 * URL constants for the Legal Information page scenarios.
 */

function resolveBaseUrl(): string {
  const target = process.env['AURA_TARGET_URL']?.trim();
  if (target) return target.replace(/\/$/, '');
  return 'http://localhost:5173';
}

export const LegalConstants = {
  BASE_URL: resolveBaseUrl(),
  LEGAL_PATH: '/legal',
  get LEGAL_URL() {
    return `${LegalConstants.BASE_URL}${LegalConstants.LEGAL_PATH}`;
  },
  PAGE_TITLE_EN: 'Legal Information',
  PAGE_TITLE_ES: 'Información Legal',
  PAGE_TITLE_PT: 'Informações Legais',
  NAV_LABEL: 'Legal',
} as const;
