/**
 * AURA — Legal Information Page constants
 *
 * URL base: uses `AURA_TARGET_URL` from .env (default local URL if not set).
 * Compatibility: defaults to http://localhost:3000 (Vite / Docker frontend).
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

  PAGE_TITLE: 'Informaciónes Legales',
  NAV_LABEL: 'Informaciónes Legales',
  SECTION_1: '1. Aviso Legal',
  SECTION_2: '2. Términos y Condiciones',
  SECTION_3: '3. Datos Legales Empresariales',
  SECTION_4: '4. Regulación y Licencias',
} as const;
