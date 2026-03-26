/**
 * AURA — Legal Information (TuCreditoOnline) constants
 *
 * URL base: uses `AURA_TARGET_URL` from .env (only variable for local environment by default).
 * Compatibility: if `AURA_HOME_BASE_URL` exists, it takes priority over the default.
 * Default local: http://localhost:3000 (Vite / Docker frontend).
 */
const DEFAULT_LOCAL = 'http://localhost:3000';

function resolveBaseUrl(): string {
  const legacy = process.env['AURA_HOME_BASE_URL']?.trim();
  if (legacy) return legacy.replace(/\/$/, '');
  const target = process.env['AURA_TARGET_URL']?.trim();
  if (target) return target.replace(/\/$/, '');
  return DEFAULT_LOCAL.replace(/\/$/, '');
}

export const LegalInformationConstants = {
  BASE_URL: resolveBaseUrl(),
  LEGAL_PATH: '/legal',
  
  get LEGAL_URL(): string {
    const b = LegalInformationConstants.BASE_URL.replace(/\/$/, '');
    return `${b}${LegalInformationConstants.LEGAL_PATH}`;
  },
  
  PAGE_TITLE_ES: 'Información Legal',
  PAGE_TITLE_EN: 'Legal Information',
  PAGE_TITLE_PT: 'Informações Legais',
  
  NAV_LABEL_ES: 'Información Legal',
  NAV_LABEL_EN: 'Legal Information',
  NAV_LABEL_PT: 'Informações Legais',
  
  SECTION_1_TITLE_ES: '1. Información Regulatoria',
  SECTION_1_TITLE_EN: '1. Regulatory Information',
  SECTION_1_TITLE_PT: '1. Informações Regulatórias',
  
  SECTION_5_TITLE_ES: '5. Contacto Legal',
  SECTION_5_TITLE_EN: '5. Legal Contact',
  SECTION_5_TITLE_PT: '5. Contato Legal',
} as const;
