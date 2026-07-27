import { Decimal } from '@prisma/client/runtime/library';

/**
 * ============================================================================
 *  Agregación de liquidaciones — DOMINIO PURO (sin Nest/Prisma).
 *
 *  Regla de negocio crítica (USECASES §7): un empleado puede tener VARIAS
 *  versiones de liquidación en un periodo (reprocesos). Un consolidado solo debe
 *  contar la VERSIÓN VIGENTE (la de mayor `calculationVersion`) por empleado y
 *  periodo — nunca sumar versiones históricas, o los totales se inflan.
 *
 *  Esta capa recibe filas ya cargadas y produce los totales; es testeable sin BD.
 * ============================================================================
 */

/** Fila mínima de liquidación necesaria para consolidar. */
export interface CalculationRow {
  employeeId: string;
  periodId: string;
  calculationVersion: number;
  component80Result: Decimal;
  component20Result: Decimal;
  totalIncentive: Decimal;
  guaranteedPayApplied: boolean;
}

export interface ConsolidatedTotals {
  employeeCount: number;
  total80: Decimal;
  total20: Decimal;
  totalIncentive: Decimal;
  guaranteedCount: number;
}

const ZERO = new Decimal(0);

/**
 * Filtra a la versión vigente por (empleado, periodo): de cada grupo conserva la
 * fila con mayor `calculationVersion`. Devuelve una fila por empleado/periodo.
 */
export function latestVersionOnly(rows: CalculationRow[]): CalculationRow[] {
  const winners = new Map<string, CalculationRow>();
  for (const row of rows) {
    const key = `${row.employeeId}|${row.periodId}`;
    const current = winners.get(key);
    if (!current || row.calculationVersion > current.calculationVersion) {
      winners.set(key, row);
    }
  }
  return [...winners.values()];
}

/**
 * Suma los totales de un conjunto de liquidaciones, contando solo la versión
 * vigente de cada empleado/periodo.
 */
export function consolidate(rows: CalculationRow[]): ConsolidatedTotals {
  const latest = latestVersionOnly(rows);

  let total80 = ZERO;
  let total20 = ZERO;
  let totalIncentive = ZERO;
  let guaranteedCount = 0;

  for (const row of latest) {
    total80 = total80.add(row.component80Result);
    total20 = total20.add(row.component20Result);
    totalIncentive = totalIncentive.add(row.totalIncentive);
    if (row.guaranteedPayApplied) guaranteedCount++;
  }

  return {
    employeeCount: latest.length,
    total80: total80.toDecimalPlaces(2),
    total20: total20.toDecimalPlaces(2),
    totalIncentive: totalIncentive.toDecimalPlaces(2),
    guaranteedCount,
  };
}
