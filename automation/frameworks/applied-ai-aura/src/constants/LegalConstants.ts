/**
 * AURA — Legal Page constants
 *
 * URL base: uses `AURA_TARGET_URL` from .env (default local).
 * Compatibility: if `AURA_TARGET_URL` exists, use it; otherwise default to http://localhost:3000.
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

  PAGE_TITLE_PT: 'Aviso Legal',
  PAGE_TITLE_ES: 'Aviso Legal',
  PAGE_TITLE_EN: 'Legal Notice',

  SECTION_1_PT: '1. Regulamentações Aplicáveis',
  SECTION_2_PT: '2. Proteção de Dados',
  SECTION_3_PT: '3. Limitação de Responsabilidade',
  SECTION_4_PT: '4. Conformidade Regulatória',
  SECTION_5_PT: '5. Alterações e Atualizações',

  SECTION_1_ES: '1. Regulaciones Aplicables',
  SECTION_2_ES: '2. Protección de Datos',
  SECTION_3_ES: '3. Limitación de Responsabilidad',
  SECTION_4_ES: '4. Cumplimiento Normativo',
  SECTION_5_ES: '5. Cambios y Actualizaciones',

  SECTION_1_EN: '1. Applicable Regulations',
  SECTION_2_EN: '2. Data Protection',
  SECTION_3_EN: '3. Limitation of Liability',
  SECTION_4_EN: '4. Regulatory Compliance',
  SECTION_5_EN: '5. Changes and Updates',

  CONTACT_BUTTON_PT: 'Entre em Contato',
  CONTACT_BUTTON_ES: 'Contáctenos',
  CONTACT_BUTTON_EN: 'Contact Us',
} as const;
