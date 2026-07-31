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

/**
 * Cuánto de la bolsa del 20% gana un mes: 0, 0.5 o 1.
 *
 * Casi todos los meses se miden con UN KPI y el mes es todo o nada. Pero hay
 * meses medidos con DOS, y ahí el mes se parte por mitades: cumplir uno de los
 * dos gana medio mes, cumplir los dos gana el mes entero.
 *
 * Devuelve una FRACCIÓN, no un booleano, porque "medio mes cumplido" no cabe en
 * un booleano y redondearlo a cumple/no cumple pagaría de más o de menos media
 * bolsa en cada mes de dos KPIs.
 *
 * @param kpiCount   con cuántos KPIs se midió el mes (1 o 2); cualquier otro
 *                   valor se trata como 1, que es el régimen normal
 * @param meetsKpi   cumplimiento del primer KPI
 * @param meetsKpi2  cumplimiento del segundo; se ignora si kpiCount no es 2
 */
export function monthAchievementFraction(
  kpiCount: number,
  meetsKpi: boolean,
  meetsKpi2: boolean,
): number {
  if (kpiCount === 2) {
    const met = (meetsKpi ? 1 : 0) + (meetsKpi2 ? 1 : 0);
    return met / 2;
  }
  return meetsKpi ? 1 : 0;
}
