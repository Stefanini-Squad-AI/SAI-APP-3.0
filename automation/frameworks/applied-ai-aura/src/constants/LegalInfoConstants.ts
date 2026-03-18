/**
 * AURA — Legal Information Page Constants
 *
 * Uses AURA_TARGET_URL from env (PR preview base) for /legal route.
 * Used by LegalInfo feature and steps for AC1–AC4.
 */
const getBaseUrl = (): string => {
  const url = process.env['AURA_TARGET_URL'];
  if (!url) {
    throw new Error('AURA_TARGET_URL is not defined. Set it to the preview base URL (e.g. https://pr-123-sai-app-3-0.surge.sh).');
  }
  return url.replace(/\/$/, '');
};

export const LegalInfoConstants = {
  LEGAL_PATH: '/legal',

  get BASE_URL(): string {
    return getBaseUrl();
  },

  get LEGAL_URL(): string {
    return `${LegalInfoConstants.BASE_URL}${LegalInfoConstants.LEGAL_PATH}`;
  },
} as const;
