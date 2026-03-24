const DEFAULT_BASE = 'http://localhost:5173';

function resolveBaseUrl(): string {
  const target = process.env['AURA_TARGET_URL']?.trim();
  if (target) {
    return target.replace(/\/$/, '');
  }
  return DEFAULT_BASE;
}

export const LegalInfoConstants = {
  BASE_URL: resolveBaseUrl(),
  LEGAL_PATH: '/legal',

  get LEGAL_URL() {
    return `${LegalInfoConstants.BASE_URL}${LegalInfoConstants.LEGAL_PATH}`;
  },

  NAV_LABEL: 'Legal Information',
  HERO_SUBTITLE:
    'Understand how we protect your rights, comply with regulations, and keep our policies transparent.',
  HERO_TITLE_ES: 'Información legal',
  HERO_SUBTITLE_ES:
    'Conoce cómo protegemos tus derechos, cumplimos con la normativa y mantenemos las políticas transparentes.',
  SECTION_TITLE: 'Compliance & Oversight',
  SECTION_TITLE_ES: 'Cumplimiento y supervisión',
} as const;
