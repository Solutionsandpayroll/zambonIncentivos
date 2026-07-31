import { Decimal } from '@prisma/client/runtime/library';
import { PayCurve, CurveStep } from './curve-pay';
import {
  calculateEmployeeIncentive,
  EmployeeCalculationInput,
} from './calculation-engine';

const d = (n: number) => new Decimal(n);
const step = (min: number, pay: number): CurveStep => ({
  minCompliance: d(min),
  payPercent: d(pay),
  isCeiling: false,
});

const curve = new PayCurve([step(0.9, 0.5), step(1.0, 1.0), step(1.2, 1.5)]);

function baseInput(
  overrides: Partial<EmployeeCalculationInput> = {},
): EmployeeCalculationInput {
  return {
    baseSalary: d(1000),
    rate80: d(0.8),
    rate20: d(0.2),
    components: [],
    curve,
    executionKpiResult: false,
    // Un mes normal solo devenga: es el régimen de casi todos los equipos.
    execution20Mode: 'ACCRUE',
    guaranteedPay: null,
    ...overrides,
  };
}

describe('calculateEmployeeIncentive', () => {
  it('calcula bolsas teóricas 80/20 desde el salario base', () => {
    const r = calculateEmployeeIncentive(baseInput());
    expect(r.component80Theoretical.toNumber()).toBe(800);
    expect(r.component20Theoretical.toNumber()).toBe(200);
  });

  it('80% = Σ (%curva × peso × 80% teórico) por componente', () => {
    // 1 componente, cumplimiento 100% → curva 1.0, peso 1.0 → 1.0×1.0×800 = 800
    const r = calculateEmployeeIncentive(
      baseInput({
        components: [{ componentId: 'c1', quota: d(100), sale: d(100), weight: d(1) }],
      }),
    );
    expect(r.details[0].compliancePercent.toNumber()).toBe(1);
    expect(r.details[0].curvePayPercent.toNumber()).toBe(1);
    expect(r.component80Result.toNumber()).toBe(800);
  });

  it('pondera dos componentes con curva distinta', () => {
    // c1: cumpl 100% (curva 1.0) peso 0.7 → 0.7×800 = 560
    // c2: cumpl 90%  (curva 0.5) peso 0.3 → 0.15×800 = 120
    // total 80% = 680
    const r = calculateEmployeeIncentive(
      baseInput({
        components: [
          { componentId: 'c1', quota: d(100), sale: d(100), weight: d(0.7) },
          { componentId: 'c2', quota: d(100), sale: d(90), weight: d(0.3) },
        ],
      }),
    );
    expect(r.component80Result.toNumber()).toBe(680);
  });

  it('cuota 0 no rompe (cumplimiento 0 → sin pago del componente)', () => {
    const r = calculateEmployeeIncentive(
      baseInput({
        components: [{ componentId: 'c1', quota: d(0), sale: d(500), weight: d(1) }],
      }),
    );
    expect(r.details[0].compliancePercent.toNumber()).toBe(0);
    expect(r.component80Result.toNumber()).toBe(0);
  });

  // El 20% no paga sobrecumplimiento: el KPI se cumple o no. Lo que cambia por
  // régimen es CUÁNDO se cobra.
  describe('régimen del 20%', () => {
    it('ACCRUE: un mes cumplido registra pero no paga', () => {
      const r = calculateEmployeeIncentive(
        baseInput({ executionKpiResult: true, execution20Mode: 'ACCRUE' }),
      );
      // Antes esto pagaba 800 (la bolsa × 4) todos los meses: adelantaba cuatro
      // bolsas por un solo mes cumplido, sin forma de devolverlo si fallaban
      // los tres siguientes.
      expect(r.component20Result.toNumber()).toBe(0);
      expect(r.executionKpiResult).toBe(true); // el cumplimiento sí queda registrado
      expect(r.executionCycleMultiplier).toBe(0);
    });

    it('PAY_MONTHLY (KAM/Directores): cumplido = la bolsa del mes', () => {
      const r = calculateEmployeeIncentive(
        baseInput({ executionKpiResult: true, execution20Mode: 'PAY_MONTHLY' }),
      );
      expect(r.component20Result.toNumber()).toBe(200);
      expect(r.executionCycleMultiplier).toBe(1);
    });

    it('PAY_MONTHLY: no cumplido = 0', () => {
      const r = calculateEmployeeIncentive(
        baseInput({ executionKpiResult: false, execution20Mode: 'PAY_MONTHLY' }),
      );
      expect(r.component20Result.toNumber()).toBe(0);
    });

    // Meses medidos con DOS KPIs: el mes se gana por mitades.
    it('PAY_MONTHLY: dos KPIs con uno cumplido = media bolsa', () => {
      const r = calculateEmployeeIncentive(
        baseInput({
          executionKpiResult: true,
          monthAchievement: 0.5,
          execution20Mode: 'PAY_MONTHLY',
        }),
      );
      expect(r.component20Result.toNumber()).toBe(100); // 200 × 0.5
      expect(r.executionCycleMultiplier).toBe(0.5);
    });

    it('PAY_MONTHLY: dos KPIs con los dos cumplidos = la bolsa entera', () => {
      const r = calculateEmployeeIncentive(
        baseInput({
          executionKpiResult: true,
          monthAchievement: 1,
          execution20Mode: 'PAY_MONTHLY',
        }),
      );
      expect(r.component20Result.toNumber()).toBe(200);
    });

    it('PAY_MONTHLY: sin `monthAchievement` manda el booleano (mes de un KPI)', () => {
      // Compatibilidad: los cálculos que no pasan la fracción se comportan
      // igual que antes, 1 ó 0.
      expect(
        calculateEmployeeIncentive(
          baseInput({ executionKpiResult: true, execution20Mode: 'PAY_MONTHLY' }),
        ).component20Result.toNumber(),
      ).toBe(200);
    });

    it('NONE: un equipo mensual no cobra nada en el cierre del ciclo', () => {
      const r = calculateEmployeeIncentive(
        baseInput({ executionKpiResult: true, execution20Mode: 'NONE' }),
      );
      expect(r.component20Result.toNumber()).toBe(0);
    });
  });

  // El pago del ciclo es PROPORCIONAL: un mes cumplido = una bolsa mensual.
  describe('PAY_CYCLE: el cierre paga una bolsa por mes cumplido', () => {
    const cycle = (met: number) =>
      calculateEmployeeIncentive(
        baseInput({
          execution20Mode: 'PAY_CYCLE',
          metMonthsInCycle: met,
          cycleLengthMonths: 4,
        }),
      );

    it('0 de 4 meses cumplidos = 0', () => {
      expect(cycle(0).component20Result.toNumber()).toBe(0);
    });

    it('3 de 4 meses cumplidos = 3 bolsas', () => {
      const r = cycle(3);
      expect(r.component20Result.toNumber()).toBe(600); // 200 × 3
      expect(r.executionCycleMultiplier).toBe(3);
    });

    it('4 de 4 meses cumplidos = el ciclo completo', () => {
      expect(cycle(4).component20Result.toNumber()).toBe(800); // 200 × 4
    });

    it('2.5 meses (uno de ellos de dos KPIs a medias) = 2.5 bolsas', () => {
      // Los medios vienen de los meses medidos con dos KPIs: no se redondean,
      // porque redondear pagaría media bolsa de más o de menos.
      const r = cycle(2.5);
      expect(r.component20Result.toNumber()).toBe(500); // 200 × 2.5
      expect(r.executionCycleMultiplier).toBe(2.5);
    });

    it('con garantizado, 2 de 4 igual cobra el ciclo completo', () => {
      // La garantía es sobre SI cobra, no sobre cuándo: el piso del cierre es
      // el ciclo entero aunque haya cumplido menos meses.
      const r = calculateEmployeeIncentive(
        baseInput({
          execution20Mode: 'PAY_CYCLE',
          metMonthsInCycle: 2,
          cycleLengthMonths: 4,
          guaranteedPay: { apply80: false, apply20: true },
        }),
      );
      expect(r.component20Result.toNumber()).toBe(800); // 200 × 4, no 400
    });
  });

  it('pago garantizado del 80% fuerza la bolsa completa aunque no cumpla', () => {
    const r = calculateEmployeeIncentive(
      baseInput({
        components: [{ componentId: 'c1', quota: d(100), sale: d(0), weight: d(1) }],
        guaranteedPay: { apply80: true, apply20: false },
      }),
    );
    expect(r.component80Result.toNumber()).toBe(800); // completo pese a venta 0
    expect(r.guaranteedPayApplied).toBe(true);
  });

  it('pago garantizado del 20% paga la bolsa del mes aunque el KPI no se cumpla', () => {
    const r = calculateEmployeeIncentive(
      baseInput({
        executionKpiResult: false,
        execution20Mode: 'PAY_MONTHLY',
        guaranteedPay: { apply80: false, apply20: true },
      }),
    );
    expect(r.component20Result.toNumber()).toBe(200);
    expect(r.guaranteedPayApplied).toBe(true);
  });

  it('el garantizado del 20% NO adelanta el calendario en un mes de devengo', () => {
    // La garantía asegura QUE cobre, no CUÁNDO. Antes esto pagaba bolsa × 4
    // cada mes a los garantizados; ahora el piso del mes es 0 y el cobro llega
    // completo en el cierre del ciclo (ver PAY_CYCLE con garantía).
    const r = calculateEmployeeIncentive(
      baseInput({
        executionKpiResult: false,
        execution20Mode: 'ACCRUE',
        guaranteedPay: { apply80: false, apply20: true },
      }),
    );
    expect(r.component20Result.toNumber()).toBe(0);
    expect(r.guaranteedPayApplied).toBe(true);
  });

  describe('el pago garantizado es un PISO, no un techo', () => {
    // Caso real: Liliana Oñoro sobrecumplió los tres componentes y con el
    // garantizado tratado como valor fijo cobraba $851.552 MENOS de lo ganado.
    it('respeta lo calculado cuando supera la bolsa teórica', () => {
      const r = calculateEmployeeIncentive(
        baseInput({
          // cumplimiento 120% → curva 1.5 → 1.5 × 800 = 1200, por encima de 800
          components: [{ componentId: 'c1', quota: d(100), sale: d(120), weight: d(1) }],
          guaranteedPay: { apply80: true, apply20: false },
        }),
      );
      expect(r.component80Result.toNumber()).toBe(1200);
      expect(r.guaranteedPayApplied).toBe(true);
    });

    it('cubre el mínimo cuando lo calculado queda por debajo', () => {
      const r = calculateEmployeeIncentive(
        baseInput({
          // cumplimiento 90% → curva 0.5 → 400, por debajo de la bolsa de 800
          components: [{ componentId: 'c1', quota: d(100), sale: d(90), weight: d(1) }],
          guaranteedPay: { apply80: true, apply20: false },
        }),
      );
      expect(r.component80Result.toNumber()).toBe(800);
    });

    it('sin garantizado, el sobrecumplimiento se paga igual', () => {
      const r = calculateEmployeeIncentive(
        baseInput({
          components: [{ componentId: 'c1', quota: d(100), sale: d(120), weight: d(1) }],
        }),
      );
      expect(r.component80Result.toNumber()).toBe(1200);
      expect(r.guaranteedPayApplied).toBe(false);
    });

    it('el piso del 20% no duplica lo ya pagado por KPI cumplido', () => {
      const r = calculateEmployeeIncentive(
        baseInput({
          executionKpiResult: true,
          execution20Mode: 'PAY_MONTHLY',
          guaranteedPay: { apply80: false, apply20: true },
        }),
      );
      expect(r.component20Result.toNumber()).toBe(200); // la bolsa, no 400
    });
  });

  it('total = 80% + 20%', () => {
    const r = calculateEmployeeIncentive(
      baseInput({
        components: [{ componentId: 'c1', quota: d(100), sale: d(100), weight: d(1) }],
        executionKpiResult: true,
        execution20Mode: 'PAY_MONTHLY',
      }),
    );
    // 80% = 800, 20% = 200 → 1000
    expect(r.totalIncentive.toNumber()).toBe(1000);
  });

  describe('redondeo del cumplimiento a 2 decimales (paridad con el libro)', () => {
    // La curva oficial tiene umbrales de centésima en centésima. El libro hace
    // ROUND(venta/cuota, 2) y luego VLOOKUP exacto; el motor debe caer en el
    // mismo escalón. Caso real: Sandra Medina, Fluimucil 6046/5818.94.
    const fineCurve = new PayCurve([
      step(1.03, 1.08),
      step(1.04, 1.103333),
      step(1.05, 1.128333),
    ]);

    it('redondea hacia arriba al escalón que usa el libro', () => {
      const r = calculateEmployeeIncentive(
        baseInput({
          curve: fineCurve,
          components: [
            { componentId: 'c1', quota: d(5818.94), sale: d(6046), weight: d(1) },
          ],
        }),
      );
      // crudo = 1.039021… → 1.04, no 1.03 (que pagaría 1.08)
      expect(r.details[0].compliancePercent.toNumber()).toBe(1.04);
      expect(r.details[0].curvePayPercent.toNumber()).toBe(1.103333);
    });

    it('redondea hacia abajo cuando corresponde', () => {
      const r = calculateEmployeeIncentive(
        baseInput({
          curve: fineCurve,
          components: [{ componentId: 'c1', quota: d(1000), sale: d(1032), weight: d(1) }],
        }),
      );
      expect(r.details[0].compliancePercent.toNumber()).toBe(1.03);
      expect(r.details[0].curvePayPercent.toNumber()).toBe(1.08);
    });

    it('no altera un cumplimiento que ya cae exacto en un escalón', () => {
      const r = calculateEmployeeIncentive(
        baseInput({
          components: [{ componentId: 'c1', quota: d(100), sale: d(100), weight: d(1) }],
        }),
      );
      expect(r.details[0].compliancePercent.toNumber()).toBe(1);
    });
  });
});
