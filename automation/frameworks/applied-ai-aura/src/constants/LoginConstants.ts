/**
 * AURA — Login Constants
 *
 * RULE: Each constants file defines its own URLs.
 *       AURA_BASE_URL from .env is not used for app under test routes.
 *       Test credentials and data should live in .feature Examples tables.
 */
export const LoginConstants = {
  BASE_URL:      'https://the-internet.herokuapp.com',
  LOGIN_PATH:    '/login',
  SECURE_PATH:   '/secure',

  get LOGIN_URL()  { return `${LoginConstants.BASE_URL}${LoginConstants.LOGIN_PATH}`; },
  get SECURE_URL() { return `${LoginConstants.BASE_URL}${LoginConstants.SECURE_PATH}`; },
} as const;
