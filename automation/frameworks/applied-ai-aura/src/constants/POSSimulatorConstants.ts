const DEFAULT_LOCAL = 'http://localhost:3000';

function resolveBaseUrl(): string {
  const target = process.env['AURA_TARGET_URL']?.trim();
  if (target) return target.replace(/\/$/, '');
  return DEFAULT_LOCAL;
}

export const POSSimulatorConstants = {
  BASE_URL: resolveBaseUrl(),
  POS_SIMULATOR_PATH: '/pos-simulator',
  get POS_SIMULATOR_URL() {
    return `${POSSimulatorConstants.BASE_URL}${POSSimulatorConstants.POS_SIMULATOR_PATH}`;
  },
  PAGE_TITLE: 'Simulador de Punto de Venta',
  ONLINE_PAYMENT_BUTTON: 'Continuar con Pago en Línea',
  POS_PAYMENT_BUTTON: 'Continuar con Pago por POS',
  MODAL_ONLINE_TITLE: 'Pago en Línea',
  MODAL_POS_TITLE: 'Pago por Terminal POS',
  SUCCESS_TITLE_ONLINE: '¡Pago Procesado Exitosamente!',
} as const;
