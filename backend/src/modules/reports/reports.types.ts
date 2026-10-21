/** Detalle de un componente en el cálculo del 80%. */
export interface ComponentDetail {
  componentName: string;
  compliancePercent: number;
  componentIncentiveValue: number;
}

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
  /** Fracción de `achievementBase` alcanzada; `null` si no hay base contra la cual medir. */
  achievementPercent: number | null;
  /** Base del logro: `idealTotal`, o solo el 80% cuando el 20% va diferido. */
  achievementBase: number;
  /** True si el logro mide solo el 80% porque el 20% se cobra al cierre del ciclo. */
  achievementExcludes20: boolean;
  guaranteedPayApplied: boolean;
  calculationVersion: number;
  status: string;
  /** Detalle por componente (solo en reportes individuales). */
  componentDetails?: ComponentDetail[];
}

/** Totales agregados de un conjunto de filas. */
export interface ReportTotals {
  employeeCount: number;
  total80: number;
  total20: number;
  totalIncentive: number;
  /** Suma de los ideales: el techo del grupo. */
  totalIdeal: number;
  /**
   * Suma de las bases de logro. Difiere de `totalIdeal` cuando hay filas con el
   * 20% diferido, y es el denominador correcto del logro del grupo.
   */
  totalAchievementBase: number;
  /** Logro del grupo = totalIncentive / totalAchievementBase. */
  achievementPercent: number | null;
  guaranteedCount: number;
}
