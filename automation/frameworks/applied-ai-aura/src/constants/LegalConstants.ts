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
  PAGE_TITLE_ES: 'Información Legal',
  PAGE_TITLE_PT: 'Informação Legal',
} as const;
