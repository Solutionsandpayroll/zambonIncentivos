/** Fila de tabla consolidada usada por reportes y exportadores. */
export interface ReportRow {
  employeeId: string;
  documentNumber: string;
  fullName: string;
  team: string | null;
  component80: number;
  component20: number;
  totalIncentive: number;
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
  guaranteedCount: number;
}
