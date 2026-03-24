/**
 * AURA — Login Constants
 *
 * URL base: uses `AURA_TARGET_URL` from .env or defaults to localhost:3000.
 */
const DEFAULT_LOCAL = 'http://localhost:3000';

function resolveBaseUrl(): string {
  const target = process.env['AURA_TARGET_URL']?.trim();
  if (target) return target.replace(/\/$/, '');
  return DEFAULT_LOCAL;
}

export const LoginConstants = {
  BASE_URL: resolveBaseUrl(),
  LOGIN_PATH: '/admin/login',
  DASHBOARD_PATH: '/admin/dashboard',

  get LOGIN_URL() { return `${LoginConstants.BASE_URL}${LoginConstants.LOGIN_PATH}`; },
  get DASHBOARD_URL() { return `${LoginConstants.BASE_URL}${LoginConstants.DASHBOARD_PATH}`; },
} as const;
