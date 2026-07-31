/**
 * Reglas de ejecución del 20% (USECASES §0.3, §4.5).
 *
 * El 20% se gana MES A MES —se cumple o no el KPI— pero no se cobra igual en
 * todos los equipos:
 *
 *  - La mayoría lo ACUMULA: cada mes solo se registra el cumplimiento y se paga
 *    0; al cerrar el ciclo se cobra una bolsa por cada mes cumplido.
 *  - KAM y las direcciones lo cobran MENSUAL, una bolsa por mes cumplido.
 *
 * Quién cobra mensual sale de `Team.pays20Monthly`, no de una lista de códigos.
 * Antes era una constante con los códigos 'KAMS', 'DIR_COMERCIAL' y
 * 'DIR_SELL_OUT', y NINGUNO coincidía con el catálogo real, así que esos
 * equipos se liquidaban por ciclo sin que nadie lo notara.
 */

export type Execution20Mode =
  /** Cobra una bolsa cada mes que cumpla (KAM, direcciones). */
  | 'PAY_MONTHLY'
  /** Mes normal: se registra el cumplimiento y se paga 0. */
  | 'ACCRUE'
  /** Cierre de ciclo: paga una bolsa por cada mes cumplido. */
  | 'PAY_CYCLE'
  /** No aplica (p. ej. un equipo mensual en la liquidación de un ciclo). */
  | 'NONE';

/** Meses que componen un ciclo. */
export const MONTHS_PER_CYCLE = 4;

/**
 * Qué régimen aplica a un equipo en un periodo.
 *
 * @param pays20Monthly de `Team.pays20Monthly`
 * @param periodType    'MONTH' para la liquidación mensual, 'CYCLE' para el cierre
 */
export function execution20ModeFor(
  pays20Monthly: boolean,
  periodType: 'MONTH' | 'CYCLE',
): Execution20Mode {
  if (pays20Monthly) {
    // Ya cobró mes a mes: el cierre del ciclo no le aporta nada, y pagarle ahí
    // sería pagarle dos veces.
    return periodType === 'CYCLE' ? 'NONE' : 'PAY_MONTHLY';
  }
  return periodType === 'CYCLE' ? 'PAY_CYCLE' : 'ACCRUE';
}

/**
 * Multiplicador TEÓRICO del 20%, para el escenario ideal y los reportes.
 *
 * Es cuántas bolsas llegaría a cobrar la persona en el ciclo cumpliendo todo:
 * 4 para quien acumula, 1 para quien cobra mensual. No depende de si este mes
 * concreto se paga o se difiere — el ideal es un techo contractual, no un
 * calendario de caja.
 */
export function theoreticalMultiplierFor(pays20Monthly: boolean): number {
  return pays20Monthly ? 1 : MONTHS_PER_CYCLE;
}
