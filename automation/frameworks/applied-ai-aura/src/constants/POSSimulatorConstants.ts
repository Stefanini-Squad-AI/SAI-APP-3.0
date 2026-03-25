/**
 * AURA — POSSimulator Constants
 *
 * URL base: usa `AURA_TARGET_URL` del .env (única variable para entorno local por defecto).
 * Por defecto local: http://localhost:3000 (Vite / Docker del frontend).
 */
const DEFAULT_LOCAL = 'http://localhost:3000';

function resolveBaseUrl(): string {
  const target = process.env['AURA_TARGET_URL']?.trim();
  if (target) return target.replace(/\/$/, '');
  return DEFAULT_LOCAL.replace(/\/$/, '');
}

export const POSSimulatorConstants = {
  BASE_URL: resolveBaseUrl(),
  POS_SIMULATOR_PATH: '/pos-simulator',

  get POS_SIMULATOR_URL(): string {
    return `${POSSimulatorConstants.BASE_URL}${POSSimulatorConstants.POS_SIMULATOR_PATH}`;
  },

  PAGE_TITLE: 'Simulador de Productos Especiales + Pago',
  NAV_LABEL: 'Simulador POS',
  SECTION_HEADING: 'Formulario de Simulación',
  HERO_TITLE: 'Simulador de Productos Especiales + Pago',
} as const;
