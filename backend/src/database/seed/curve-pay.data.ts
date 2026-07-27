/**
 * Curva de pago oficial de Zambon — fuente: calculocomisiones.xlsx, pestaña
 * "Curve Pay" (año 2025, mes 1). Traduce % de cumplimiento → % de pago.
 *
 * Decisión de negocio (24-jul-2026): desde 120% inclusive se paga el TOPE 1.50.
 * El Excel tiene una fila 1.20 → 1.50166 y otra ">120%" → 1.50; se unifica en un
 * único escalón 1.20 con isCeiling=true y payPercent=1.50 (curva monótona limpia).
 *
 * Por debajo del primer escalón (0.90) el pago es 0 — lo aplica el motor.
 */
export interface CurveStepSeed {
  minCompliancePercent: number;
  payPercent: number;
  isCeiling?: boolean;
}

export const OFFICIAL_CURVE_PAY: CurveStepSeed[] = [
  { minCompliancePercent: 0.9, payPercent: 0.5 },
  { minCompliancePercent: 0.91, payPercent: 0.55 },
  { minCompliancePercent: 0.92, payPercent: 0.6 },
  { minCompliancePercent: 0.93, payPercent: 0.65 },
  { minCompliancePercent: 0.94, payPercent: 0.7 },
  { minCompliancePercent: 0.95, payPercent: 0.75 },
  { minCompliancePercent: 0.96, payPercent: 0.8 },
  { minCompliancePercent: 0.97, payPercent: 0.85 },
  { minCompliancePercent: 0.98, payPercent: 0.9 },
  { minCompliancePercent: 0.99, payPercent: 0.95 },
  { minCompliancePercent: 1.0, payPercent: 1.0 },
  { minCompliancePercent: 1.01, payPercent: 1.03 },
  { minCompliancePercent: 1.02, payPercent: 1.05 },
  { minCompliancePercent: 1.03, payPercent: 1.08 },
  { minCompliancePercent: 1.04, payPercent: 1.103333 },
  { minCompliancePercent: 1.05, payPercent: 1.128333 },
  { minCompliancePercent: 1.06, payPercent: 1.153333 },
  { minCompliancePercent: 1.07, payPercent: 1.178333 },
  { minCompliancePercent: 1.08, payPercent: 1.203333 },
  { minCompliancePercent: 1.09, payPercent: 1.228333 },
  { minCompliancePercent: 1.1, payPercent: 1.253333 },
  { minCompliancePercent: 1.11, payPercent: 1.28 },
  { minCompliancePercent: 1.12, payPercent: 1.3 },
  { minCompliancePercent: 1.13, payPercent: 1.33 },
  { minCompliancePercent: 1.14, payPercent: 1.35 },
  { minCompliancePercent: 1.15, payPercent: 1.376667 },
  { minCompliancePercent: 1.16, payPercent: 1.401667 },
  { minCompliancePercent: 1.17, payPercent: 1.426667 },
  { minCompliancePercent: 1.18, payPercent: 1.451667 },
  { minCompliancePercent: 1.19, payPercent: 1.476667 },
  // Tope: desde 120% inclusive se paga 1.50 (decisión de negocio).
  { minCompliancePercent: 1.2, payPercent: 1.5, isCeiling: true },
];
