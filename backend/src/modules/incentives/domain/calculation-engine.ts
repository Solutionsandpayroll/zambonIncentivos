import { Decimal } from '@prisma/client/runtime/library';
import { PayCurve } from './curve-pay';

/**
 * ============================================================================
 *  Motor de cálculo de incentivos — DOMINIO PURO
 *  Sin dependencias de NestJS ni Prisma: recibe insumos ya cargados y devuelve
 *  el resultado. Es la pieza más crítica del sistema, por eso vive aislada y
 *  con tests unitarios (USECASES §4, diseno-modulos-backend §10).
 *
 *  Fórmula (USECASES §0):
 *    cumplimiento = venta_real / cuota
 *    %comisión    = curva(cumplimiento)
 *    aporte       = %comisión × peso × (80% teórico)
 *    resultado80  = Σ aportes
 *    resultado20  = (cumpleKPI ? 20% teórico : 0) × (mensual ? 1 : 4)
 *    total        = resultado80 + resultado20     // salvo pago garantizado
 * ============================================================================
 */

/** Insumo de un componente del equipo del empleado en el periodo. */
export interface ComponentInput {
  componentId: string;
  /** Cuota objetivo (team_component_target.quotaValue). */
  quota: Decimal;
  /** Venta real (Σ sales_transaction.saleValue del componente). */
  sale: Decimal;
  /** Peso del componente para el equipo/periodo (debe sumar 1.0 en el equipo). */
  weight: Decimal;
}

/** Excepción de pago garantizado aplicable al empleado en el periodo. */
export interface GuaranteedPayInput {
  apply80: boolean;
  apply20: boolean;
}

export interface EmployeeCalculationInput {
  baseSalary: Decimal;
  /** Tasa de la bolsa 80% (config, típicamente 0.80). */
  rate80: Decimal;
  /** Tasa de la bolsa 20% (config, típicamente 0.20). */
  rate20: Decimal;
  components: ComponentInput[];
  curve: PayCurve;
  /** KPI de ejecución del 20%: true = cumple. */
  executionKpiResult: boolean;
  /** Multiplicador del 20%: 1 (mensual: KAMS/Directores) o 4 (por ciclo). */
  cycleMultiplier: number;
  /** Excepción de pago garantizado, si aplica (NEW_HIRE / ZONE_CHANGE). */
  guaranteedPay?: GuaranteedPayInput | null;
}

export interface ComponentResult {
  componentId: string;
  quotaValue: Decimal;
  saleValue: Decimal;
  compliancePercent: Decimal;
  curvePayPercent: Decimal;
  weightedComponentPercent: Decimal;
  componentIncentiveValue: Decimal;
}

export interface EmployeeCalculationResult {
  baseSalary: Decimal;
  component80Theoretical: Decimal;
  component20Theoretical: Decimal;
  component80Result: Decimal;
  component20Result: Decimal;
  totalIncentive: Decimal;
  guaranteedPayApplied: boolean;
  executionKpiResult: boolean;
  executionCycleMultiplier: number;
  details: ComponentResult[];
}

const ZERO = new Decimal(0);

/** Redondea a 2 decimales (centavos), medio hacia arriba. */
function money(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function calculateEmployeeIncentive(
  input: EmployeeCalculationInput,
): EmployeeCalculationResult {
  const theoretical80 = money(input.baseSalary.mul(input.rate80));
  const theoretical20 = money(input.baseSalary.mul(input.rate20));

  const gp = input.guaranteedPay;

  // ---- 80% por componente -------------------------------------------------
  const details: ComponentResult[] = [];
  let sum80 = ZERO;

  for (const c of input.components) {
    // cumplimiento = venta / cuota (cuota 0 → cumplimiento 0, evita /0).
    const compliance = c.quota.isZero()
      ? ZERO
      : c.sale.div(c.quota);

    const curvePay = input.curve.payPercentFor(compliance);
    const weighted = curvePay.mul(c.weight);
    const value = money(weighted.mul(theoretical80));

    details.push({
      componentId: c.componentId,
      quotaValue: c.quota,
      saleValue: c.sale,
      compliancePercent: compliance,
      curvePayPercent: curvePay,
      weightedComponentPercent: weighted,
      componentIncentiveValue: value,
    });

    sum80 = sum80.add(value);
  }

  // Pago garantizado del 80%: fuerza el pago completo de la bolsa teórica.
  let result80 = gp?.apply80 ? theoretical80 : money(sum80);

  // ---- 20% de ejecución ---------------------------------------------------
  // No paga sobrecumplimiento: es booleano × multiplicador de ciclo.
  let result20 = input.executionKpiResult
    ? money(theoretical20.mul(input.cycleMultiplier))
    : ZERO;

  if (gp?.apply20) {
    result20 = money(theoretical20.mul(input.cycleMultiplier));
  }

  const guaranteedPayApplied = Boolean(gp?.apply80 || gp?.apply20);
  const total = money(result80.add(result20));

  return {
    baseSalary: input.baseSalary,
    component80Theoretical: theoretical80,
    component20Theoretical: theoretical20,
    component80Result: result80,
    component20Result: result20,
    totalIncentive: total,
    guaranteedPayApplied,
    executionKpiResult: input.executionKpiResult,
    executionCycleMultiplier: input.cycleMultiplier,
    details,
  };
}
