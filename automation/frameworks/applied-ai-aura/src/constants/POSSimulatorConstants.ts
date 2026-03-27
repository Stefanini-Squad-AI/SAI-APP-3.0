/**
 * AURA — POS Simulator constants
 *
 * URL base: uses `AURA_TARGET_URL` from .env (sole variable for local env by default).
 * Default local: http://localhost:3000 (Vite / Docker frontend).
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
    const b = POSSimulatorConstants.BASE_URL.replace(/\/$/, '');
    return `${b}${POSSimulatorConstants.POS_SIMULATOR_PATH}`;
  },

  PAGE_TITLE: 'Simulador de Pago POS',
  FORM_SECTION: 'Datos de la Simulación',
  ONLINE_PAYMENT_LABEL: 'Continuar con Pago en Línea',
  POS_PAYMENT_LABEL: 'Continuar con POS',
  MODAL_PAYMENT_ONLINE: 'Pago en Línea',
  MODAL_PAYMENT_POS: 'Pago con POS',
  SUCCESS_MESSAGE: 'exitosamente',
} as const;
