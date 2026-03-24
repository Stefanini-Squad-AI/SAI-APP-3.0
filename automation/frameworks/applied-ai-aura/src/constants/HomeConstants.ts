/**
 * AURA — Home (TuCreditoOnline) constants
 *
 * URL base: usa `AURA_TARGET_URL` del .env (única variable para entorno local por defecto).
 * Compatibilidad: si existe `AURA_HOME_BASE_URL`, tiene prioridad sobre el default.
 * Por defecto local: http://localhost:3000 (Vite / Docker del frontend).
 */
const DEFAULT_LOCAL = 'http://localhost:3000';

function resolveBaseUrl(): string {
  const legacy = process.env['AURA_HOME_BASE_URL']?.trim();
  if (legacy) return legacy.replace(/\/$/, '');
  const target = process.env['AURA_TARGET_URL']?.trim();
  if (target) return target.replace(/\/$/, '');
  return DEFAULT_LOCAL.replace(/\/$/, '');
}

export const HomeConstants = {
  BASE_URL: resolveBaseUrl(),

  get HOME_URL(): string {
    const b = HomeConstants.BASE_URL.replace(/\/$/, '');
    return `${b}/`;
  },
} as const;
