import { Decimal } from '@prisma/client/runtime/library';
import { AccrualService } from './accrual.service';

const d = (n: number) => new Decimal(n);

/** Ciclo 1 de 2026: enero–abril. */
const CYCLE = {
  periodId: 'ciclo1',
  periodYear: 2026,
  periodMonth: 4,
  periodType: 'CYCLE' as const,
  cycleNumber: 1,
  startDate: new Date(Date.UTC(2026, 0, 1)),
  endDate: new Date(Date.UTC(2026, 3, 30)),
  isClosed: false,
  parentPeriodId: null,
};

const MONTHS = [1, 2, 3, 4].map((m) => ({
  periodId: `m${m}`,
  periodYear: 2026,
  periodMonth: m,
  periodType: 'MONTH' as const,
  cycleNumber: null,
  startDate: new Date(Date.UTC(2026, m - 1, 1)),
  endDate: new Date(Date.UTC(2026, m, 0)),
  isClosed: false,
  parentPeriodId: 'ciclo1',
}));

/** Marca de un mes cumplido con un solo KPI, que es el régimen normal. */
const MET_1_KPI = { meetsKpi: true, meetsKpi2: false, kpiCount: 1 };

/**
 * @param met     meses cumplidos con un KPI (el caso normal)
 * @param extra   marcas sueltas, para los meses medidos con dos KPIs
 */
function build(met: number, extra: typeof MET_1_KPI[] = []) {
  const marks = [...Array.from({ length: met }, () => MET_1_KPI), ...extra];
  const prisma = {
    employeeExecutionKpi: { findMany: jest.fn().mockResolvedValue(marks) },
  };
  const periods = {
    findWithParent: jest.fn(async (id: string) =>
      id === 'ciclo1' ? CYCLE : (MONTHS.find((m) => m.periodId === id) ?? null),
    ),
    monthsOfCycle: jest.fn().mockResolvedValue(MONTHS),
  };
  return new AccrualService(prisma as never, periods as never);
}

const header = (over: Partial<Parameters<AccrualService['forHeader']>[0]> = {}) => ({
  employeeId: 'e1',
  periodId: 'm2',
  component20Theoretical: d(200),
  execution20Mode: 'ACCRUE',
  ...over,
});

describe('AccrualService', () => {
  it('en febrero informa 2 transcurridos de 4, no 4', () => {
    // "2 de 4 cumplidos" en febrero es engañoso: aún no han pasado los otros dos.
    return build(2)
      .forHeader(header())
      .then((a) => {
        expect(a).not.toBeNull();
        expect(a!.monthsMet).toBe(2);
        expect(a!.monthsElapsed).toBe(2);
        expect(a!.monthsTotal).toBe(4);
        expect(a!.pendingAmount).toBe(400); // 200 × 2 bolsas al cierre
        expect(a!.cycleLabel).toBe('2026 · Ciclo 1 (ene–abr)');
      });
  });

  it('los transcurridos se cuentan contra el mes que se mira, no contra hoy', async () => {
    // Reimprimir en junio la liquidación de enero debe seguir diciendo "1".
    const a = await build(1).forHeader(header({ periodId: 'm1' }));
    expect(a!.monthsElapsed).toBe(1);
  });

  it('sin nada cumplido, no hay nada pendiente', async () => {
    const a = await build(0).forHeader(header());
    expect(a!.monthsMet).toBe(0);
    expect(a!.pendingAmount).toBe(0);
  });

  it('un mes de dos KPIs con uno solo cumplido devenga media bolsa', async () => {
    // Enero completo (1 KPI) + febrero medido con dos, de los que cumplió uno.
    const a = await build(1, [
      { meetsKpi: true, meetsKpi2: false, kpiCount: 2 },
    ]).forHeader(header());
    expect(a!.monthsMet).toBe(1.5);
    expect(a!.pendingAmount).toBe(300); // 200 × 1.5
  });

  it('un mes de dos KPIs con los dos cumplidos devenga la bolsa entera', async () => {
    const a = await build(0, [
      { meetsKpi: true, meetsKpi2: true, kpiCount: 2 },
    ]).forHeader(header());
    expect(a!.monthsMet).toBe(1);
    expect(a!.pendingAmount).toBe(200);
  });

  it('un mes de dos KPIs sin ninguno cumplido no devenga nada', async () => {
    const a = await build(0, [
      { meetsKpi: false, meetsKpi2: false, kpiCount: 2 },
    ]).forHeader(header());
    expect(a!.monthsMet).toBe(0);
    expect(a!.pendingAmount).toBe(0);
  });

  it('no aplica a quien cobra el 20% mensual', async () => {
    expect(
      await build(2).forHeader(header({ execution20Mode: 'PAY_MONTHLY' })),
    ).toBeNull();
  });

  it('no aplica al header del propio cierre de ciclo', async () => {
    expect(
      await build(2).forHeader(header({ execution20Mode: 'PAY_CYCLE' })),
    ).toBeNull();
  });

  it('un mes sin ciclo padre no devenga nada visible', async () => {
    const svc = build(2);
    (svc as never as { periods: { findWithParent: jest.Mock } }).periods = {
      findWithParent: jest.fn().mockResolvedValue({ ...MONTHS[0], parentPeriodId: null }),
    } as never;
    expect(await svc.forHeader(header())).toBeNull();
  });
});
