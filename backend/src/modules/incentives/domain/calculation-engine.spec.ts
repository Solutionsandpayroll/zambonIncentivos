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
    cycleMultiplier: 4,
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

  it('20% cumplido por ciclo = 20% teórico × 4', () => {
    const r = calculateEmployeeIncentive(
      baseInput({ executionKpiResult: true, cycleMultiplier: 4 }),
    );
    expect(r.component20Result.toNumber()).toBe(800); // 200 × 4
  });

  it('20% cumplido mensual (KAMS/Directores) = 20% teórico × 1', () => {
    const r = calculateEmployeeIncentive(
      baseInput({ executionKpiResult: true, cycleMultiplier: 1 }),
    );
    expect(r.component20Result.toNumber()).toBe(200);
  });

  it('20% no cumplido = 0', () => {
    const r = calculateEmployeeIncentive(
      baseInput({ executionKpiResult: false, cycleMultiplier: 4 }),
    );
    expect(r.component20Result.toNumber()).toBe(0);
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

  it('pago garantizado del 20% paga la bolsa aunque el KPI no se cumpla', () => {
    const r = calculateEmployeeIncentive(
      baseInput({
        executionKpiResult: false,
        cycleMultiplier: 4,
        guaranteedPay: { apply80: false, apply20: true },
      }),
    );
    expect(r.component20Result.toNumber()).toBe(800); // 200 × 4
    expect(r.guaranteedPayApplied).toBe(true);
  });

  it('total = 80% + 20%', () => {
    const r = calculateEmployeeIncentive(
      baseInput({
        components: [{ componentId: 'c1', quota: d(100), sale: d(100), weight: d(1) }],
        executionKpiResult: true,
        cycleMultiplier: 4,
      }),
    );
    // 80% = 800, 20% = 800 → 1600
    expect(r.totalIncentive.toNumber()).toBe(1600);
  });
});
