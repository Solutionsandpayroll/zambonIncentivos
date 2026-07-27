/**
 * Reglas de ejecución del 20% (USECASES §0.3, §4.5).
 *
 * La mayoría de equipos cobra el 20% por CICLO (4 meses) → multiplicador 4.
 * Excepción: KAMS, Director Comercial y Director de Sell Out lo cobran MENSUAL
 * → multiplicador 1.
 *
 * Se identifica por `team_code`. Ajustar estos códigos a los reales del catálogo
 * de equipos si difieren en la carga de datos.
 */
export const MONTHLY_20_TEAM_CODES = new Set<string>([
  'KAMS',
  'DIR_COMERCIAL',
  'DIR_SELL_OUT',
]);

export const CYCLE_MULTIPLIER = 4;
export const MONTHLY_MULTIPLIER = 1;

export function cycleMultiplierForTeam(teamCode: string | null | undefined): number {
  if (teamCode && MONTHLY_20_TEAM_CODES.has(teamCode)) {
    return MONTHLY_MULTIPLIER;
  }
  return CYCLE_MULTIPLIER;
}
