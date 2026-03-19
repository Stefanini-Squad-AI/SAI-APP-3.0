/**
 * AURA — Legal information hub (SAIAPP3-18)
 * Routes, storage keys, and expected visible copy for i18n assertions.
 */
export const LANGUAGE_STORAGE_KEY = 'tco-user-language';

/** Relative path segment for the legal hub (no leading slash). */
export const LEGAL_ROUTE_SEGMENT = 'legal';

export function resolveLegalInformationUrl(): string {
  const raw = process.env['AURA_TARGET_URL'];
  if (!raw) {
    throw new Error('AURA_TARGET_URL is not defined. Configure the preview URL before running tests.');
  }
  const base = raw.endsWith('/') ? raw : `${raw}/`;
  return new URL(LEGAL_ROUTE_SEGMENT, base).href;
}
