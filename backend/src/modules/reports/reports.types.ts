/** Fila de tabla consolidada usada por reportes y exportadores. */
export interface ReportRow {
  employeeId: string;
  documentNumber: string;
  fullName: string;
  team: string | null;
  /** 'YYYY-MM' — distingue las filas cuando la exportación abarca varios periodos. */
  period: string | null;
  component80: number;
  component20: number;
  totalIncentive: number;
  /** Lo que ganaría cumpliendo el 100% (ver domain/ideal-scenario). */
  idealTotal: number;
  /** Fracción del ideal alcanzada; `null` si no hay ideal contra el cual medir. */
  achievementPercent: number | null;
  guaranteedPayApplied: boolean;
  calculationVersion: number;
  status: string;
}

/** Totales agregados de un conjunto de filas. */
export interface ReportTotals {
  employeeCount: number;
  total80: number;
  total20: number;
  totalIncentive: number;
  /** Suma de los ideales: el techo del grupo. */
  totalIdeal: number;
  /** Logro del grupo = totalIncentive / totalIdeal. */
  achievementPercent: number | null;
  guaranteedCount: number;
}
