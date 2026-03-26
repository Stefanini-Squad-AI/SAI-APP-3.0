/**
 * Tema de reportes HTML AURA (SAI-APP-3.0).
 * `grey` replica la paleta tipo test-results: fondo slate, tarjetas con borde.
 * `light` se interpreta como `grey` (sin modo blanco plano heredado).
 */
export type AuraReportTheme = 'dark' | 'grey';

export function resolveAuraReportTheme(): AuraReportTheme {
  const raw = (process.env['AURA_REPORT_THEME'] ?? 'grey').toLowerCase().trim();
  if (raw === 'grey' || raw === 'gray' || raw === 'light') {
    return 'grey';
  }
  return 'dark';
}

export function parseReportThemeEnv(raw: string | undefined): AuraReportTheme {
  const v = (raw ?? 'grey').toLowerCase().trim();
  if (v === 'grey' || v === 'gray' || v === 'light') return 'grey';
  return 'dark';
}
