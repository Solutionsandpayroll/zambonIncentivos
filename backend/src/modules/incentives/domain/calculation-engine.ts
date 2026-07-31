import { Decimal } from '@prisma/client/runtime/library';
import { PayCurve } from './curve-pay';
import { Execution20Mode } from './execution-rules';

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
 *    resultado20  = según el régimen (ver `Execution20Mode`):
 *                     PAY_MONTHLY  cumpleKPI ? bolsa : 0
 *                     ACCRUE       0 — se registra y se cobra al cierre del ciclo
 *                     PAY_CYCLE    bolsa × meses cumplidos
 *    total        = resultado80 + resultado20
 *
 *  El pago garantizado es un PISO sobre ambos componentes, nunca un techo.
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
  /**
   * Régimen del 20%. El motor NO consulta el tipo de periodo —es dominio puro,
   * sin Prisma—: el servicio decide el modo y se lo pasa.
   */
  execution20Mode: Execution20Mode;
  /** Solo en PAY_CYCLE: meses del ciclo con KPI cumplido (0..4). */
  metMonthsInCycle?: number;
  /** Solo en PAY_CYCLE: meses que componen el ciclo (normalmente 4). */
  cycleLengthMonths?: number;
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
  /** Régimen bajo el que se liquidó el 20%. */
  execution20Mode: Execution20Mode;
  /**
   * Bolsas del 20% que este resultado paga: 1 mensual, N en el cierre del
   * ciclo, 0 cuando solo se devenga. Es el multiplicador REAL, no el teórico
   * del escenario ideal.
   */
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
    //
    // Se redondea a 2 decimales ANTES de consultar la curva, igual que el libro
    // oficial: ROUND(venta/cuota, 2) y luego VLOOKUP exacto contra una tabla que
    // solo tiene umbrales de centésima en centésima. Sin este redondeo un
    // cumplimiento de 1.039021 cae en el escalón 1.03 (paga 108%) cuando la hoja
    // lo lleva a 1.04 (paga 110.33%): el sistema liquidaba de menos, nunca de
    // más, porque truncar al escalón inferior no puede sobrepagar.
    const compliance = c.quota.isZero()
      ? ZERO
      : c.sale.div(c.quota).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

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

  // Pago garantizado del 80%: es un PISO, no un techo. Asegura que la persona
  // no cobre menos que su bolsa teórica, pero si el cálculo por componentes da
  // más —porque sobrecumplió— se le paga lo que ganó. Tratarlo como valor fijo
  // castigaría justamente a quien mejor vendió.
  const computed80 = money(sum80);
  let result80 = gp?.apply80
    ? Decimal.max(theoretical80, computed80)
    : computed80;

  // ---- 20% de ejecución ---------------------------------------------------
  // No paga sobrecumplimiento: el KPI se cumple o no. Lo que cambia por régimen
  // es CUÁNDO se cobra.
  //
  // En un mes normal (ACCRUE) solo se registra el cumplimiento y se paga 0: el
  // devengo se cobra al cerrar el ciclo. Antes el motor pagaba la bolsa × 4
  // todos los meses, o sea adelantaba cuatro bolsas por un solo mes cumplido, y
  // si los tres meses siguientes fallaban no había forma de devolverlo.
  let result20: Decimal;
  // Piso que aplica el pago garantizado. En ACCRUE es 0: garantizar el pago no
  // adelanta el calendario, solo asegura cobrarlo al cierre del ciclo.
  let full20: Decimal;

  switch (input.execution20Mode) {
    case 'PAY_MONTHLY':
      full20 = money(theoretical20);
      result20 = input.executionKpiResult ? full20 : ZERO;
      break;

    case 'PAY_CYCLE': {
      // Proporcional, no todo o nada: un mes cumplido = una bolsa mensual.
      const met = input.metMonthsInCycle ?? 0;
      result20 = money(theoretical20.mul(met));
      // Para el garantizado, el piso del ciclo es el ciclo COMPLETO.
      full20 = money(theoretical20.mul(input.cycleLengthMonths ?? met));
      break;
    }

    case 'ACCRUE':
    case 'NONE':
    default:
      full20 = ZERO;
      result20 = ZERO;
      break;
  }

  // El garantizado del 20% es un PISO, no un techo.
  if (gp?.apply20) {
    result20 = Decimal.max(result20, full20);
  }

  // Bolsas pagadas, derivadas del resultado: sirve para leer el histórico sin
  // recalcular nada. 0 en un mes que solo devenga.
  const paidBags = theoretical20.isZero()
    ? 0
    : Number(result20.div(theoretical20).toDecimalPlaces(0, Decimal.ROUND_HALF_UP));

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
    execution20Mode: input.execution20Mode,
    // Bolsas realmente pagadas por este resultado.
    executionCycleMultiplier: paidBags,
    details,
  };
}
