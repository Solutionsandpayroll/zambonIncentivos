/**
 * ============================================================================
 *  Calendario de periodos — DOMINIO PURO (sin Nest/Prisma).
 *
 *  Un año son 12 meses y 3 ciclos de 4 meses: Ciclo1 ene–abr, Ciclo2 may–ago,
 *  Ciclo3 sep–dic. Siempre. La liquidación es mensual; el ciclo agrupa la
 *  parametrización (pesos, curva, cuotas) y paga el 20% acumulado.
 *
 *  El `periodMonth` de un ciclo es su ÚLTIMO mes (Ciclo1 → 4). Así se queda en
 *  el rango 1..12 que valida el DTO, no choca con la clave única
 *  (año, mes, tipo) —porque el tipo difiere— y ordena de forma natural.
 *
 *  Todas las fechas se construyen en UTC: las columnas son `@db.Date` y usar
 *  el constructor local en una máquina con offset negativo corre los límites de
 *  mes un día, rompiendo el predicado de solapamiento que usa el motor para
 *  resolver el equipo vigente.
 * ============================================================================
 */

export type PeriodTypeName = 'MONTH' | 'CYCLE';

export interface PeriodSpec {
  periodYear: number;
  periodMonth: number;
  periodType: PeriodTypeName;
  cycleNumber: number | null;
  startDate: Date;
  endDate: Date;
  /** Ciclo al que pertenece el mes; null en las filas de tipo CYCLE. */
  parentCycleNumber: number | null;
}

export const MONTHS_PER_CYCLE = 4;
export const CYCLES_PER_YEAR = 3;

/** A qué ciclo (1..3) pertenece un mes. */
export function cycleNumberForMonth(month: number): number {
  return Math.ceil(month / MONTHS_PER_CYCLE);
}

/** Último mes de un ciclo: 4, 8 o 12. */
export function lastMonthOfCycle(cycleNumber: number): number {
  return cycleNumber * MONTHS_PER_CYCLE;
}

/** Primer día del mes, en UTC. */
export function monthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

/** Último día del mes, en UTC (día 0 del mes siguiente). */
export function monthEnd(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0));
}

/** Límites [inicio, fin] de un ciclo. */
export function cycleBounds(year: number, cycleNumber: number): [Date, Date] {
  const first = (cycleNumber - 1) * MONTHS_PER_CYCLE + 1;
  return [monthStart(year, first), monthEnd(year, lastMonthOfCycle(cycleNumber))];
}

/**
 * Los 15 periodos de un año: 3 ciclos y 12 meses, en ese orden —los ciclos
 * primero porque los meses necesitan su id para enlazarse.
 */
export function buildYearCalendar(year: number): PeriodSpec[] {
  const cycles: PeriodSpec[] = [];
  for (let c = 1; c <= CYCLES_PER_YEAR; c++) {
    const [startDate, endDate] = cycleBounds(year, c);
    cycles.push({
      periodYear: year,
      periodMonth: lastMonthOfCycle(c),
      periodType: 'CYCLE',
      cycleNumber: c,
      startDate,
      endDate,
      parentCycleNumber: null,
    });
  }

  const months: PeriodSpec[] = [];
  for (let m = 1; m <= 12; m++) {
    months.push({
      periodYear: year,
      periodMonth: m,
      periodType: 'MONTH',
      cycleNumber: null,
      startDate: monthStart(year, m),
      endDate: monthEnd(year, m),
      parentCycleNumber: cycleNumberForMonth(m),
    });
  }

  return [...cycles, ...months];
}

/** Etiqueta legible: '2026-03' o '2026 · Ciclo 1 (ene–abr)'. */
export function periodLabel(spec: {
  periodYear: number;
  periodMonth: number;
  periodType: PeriodTypeName;
  cycleNumber: number | null;
}): string {
  if (spec.periodType !== 'CYCLE' || !spec.cycleNumber) {
    return `${spec.periodYear}-${String(spec.periodMonth).padStart(2, '0')}`;
  }
  const first = (spec.cycleNumber - 1) * MONTHS_PER_CYCLE + 1;
  const names = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  // Se ignora `periodMonth` a propósito: '2026-04 · Ciclo' se leería como un
  // ciclo de abril cuando en realidad abarca de enero a abril.
  return `${spec.periodYear} · Ciclo ${spec.cycleNumber} (${names[first - 1]}–${names[lastMonthOfCycle(spec.cycleNumber) - 1]})`;
}
