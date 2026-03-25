/**
 * AURA — Legal page constants
 *
 * Base URL: uses `AURA_TARGET_URL` from environment (or defaults to local dev).
 * For deployed PR preview: CI sets `AURA_TARGET_URL` to Surge PR URL
 * (e.g., https://pr-123-sai-app-3-0.surge.sh)
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
  get LEGAL_URL() {
    return `${LegalConstants.BASE_URL}${LegalConstants.LEGAL_PATH}`;
  },
  PAGE_TITLE: 'Legal Notice',
  PAGE_TITLE_ES: 'Aviso Legal',
  PAGE_TITLE_PT: 'Aviso Legal',
  SECTION_1_EN: '1. Legal Basis and Jurisdiction',
  SECTION_1_ES: '1. Fundamento Legal y Jurisdicción',
  SECTION_1_PT: '1. Base Legal e Jurisdição',
} as const;

