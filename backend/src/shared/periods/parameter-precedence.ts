/**
 * ============================================================================
 *  Precedencia mes sobre ciclo — DOMINIO PURO (sin Nest/Prisma).
 *
 *  Los parámetros (pesos, curva, cuotas) se definen una vez en el ciclo y los
 *  meses los heredan. Un mes puede traer los suyos y esos mandan.
 *
 *  La regla es POR CONJUNTO LÓGICO, NUNCA MEZCLA: si el mes tiene alguna fila
 *  para una clave, el mes gana ENTERO para esa clave. Mezclar rompería cosas
 *  reales — los pesos de un equipo deben sumar 1.0 y una escalera de curva
 *  hecha de dos periodos distintos es incoherente.
 * ============================================================================
 */

/**
 * Devuelve las filas que mandan, agrupando por `keyOf`.
 *
 * @param monthRows filas del mes (las que prevalecen)
 * @param cycleRows filas del ciclo (el respaldo)
 * @param keyOf     conjunto lógico al que pertenece cada fila: `teamId` para
 *                  pesos, `componentId ?? 'GLOBAL'` para curva, `employeeId`
 *                  para cuotas.
 */
export function preferMonthOverCycle<T>(
  monthRows: T[],
  cycleRows: T[],
  keyOf: (row: T) => string,
): T[] {
  if (monthRows.length === 0) return cycleRows;
  if (cycleRows.length === 0) return monthRows;

  // Claves que el mes ya cubre: para esas, el ciclo no aporta nada.
  const overridden = new Set(monthRows.map(keyOf));

  return [...monthRows, ...cycleRows.filter((r) => !overridden.has(keyOf(r)))];
}

/** De dónde salió cada parámetro, para que la UI pueda marcar lo heredado. */
export type ParameterSource = 'MONTH' | 'CYCLE';

/**
 * Igual que `preferMonthOverCycle`, pero etiquetando el origen de cada fila.
 * Lo usan los lectores de catálogos para que la pantalla distinga un valor
 * propio del mes de uno heredado del ciclo.
 */
export function preferMonthOverCycleTagged<T>(
  monthRows: T[],
  cycleRows: T[],
  keyOf: (row: T) => string,
): Array<T & { source: ParameterSource }> {
  const overridden = new Set(monthRows.map(keyOf));
  return [
    ...monthRows.map((r) => ({ ...r, source: 'MONTH' as const })),
    ...cycleRows
      .filter((r) => !overridden.has(keyOf(r)))
      .map((r) => ({ ...r, source: 'CYCLE' as const })),
  ];
}
