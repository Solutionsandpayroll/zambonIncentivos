import { IncentivesService } from './incentives.service';

/**
 * `closesCycle` decide si el asistente de Cálculo ofrece liquidar el 20% al
 * terminar un mes. Si se equivoca, o se ofrece pagar cuatro meses de bolsa en
 * un mes cualquiera, o el cierre real pasa desapercibido y el devengo se queda
 * sin cobrar. Por eso se prueba aparte de la aritmética del motor.
 */

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

/** Invoca el método privado sin exponerlo solo para el test. */
function closesCycle(svc: IncentivesService, monthId: string) {
  return (
    svc as unknown as {
      cycleClosedBy(id: string): Promise<{ periodId: string; label: string } | null>;
    }
  ).cycleClosedBy(monthId);
}

function build(over: { cycleClosed?: boolean; months?: typeof MONTHS } = {}) {
  const cycle = { ...CYCLE, isClosed: over.cycleClosed ?? false };
  const periods = {
    findWithParent: jest.fn(async (id: string) =>
      id === 'ciclo1' ? cycle : (MONTHS.find((m) => m.periodId === id) ?? null),
    ),
    monthsOfCycle: jest.fn().mockResolvedValue(over.months ?? MONTHS),
  };
  return new IncentivesService(
    {} as never,
    {} as never,
    periods as never,
    {} as never,
  );
}

describe('IncentivesService · qué ciclo cierra un mes', () => {
  it('el ÚLTIMO mes del ciclo lo cierra', async () => {
    const r = await closesCycle(build(), 'm4');
    expect(r).toEqual({ periodId: 'ciclo1', label: '2026 · Ciclo 1 (ene–abr)' });
  });

  it('los meses intermedios no cierran nada', async () => {
    // Ofrecer aquí la liquidación pagaría el ciclo entero a mitad de camino.
    expect(await closesCycle(build(), 'm1')).toBeNull();
    expect(await closesCycle(build(), 'm2')).toBeNull();
    expect(await closesCycle(build(), 'm3')).toBeNull();
  });

  it('un mes sin ciclo padre no cierra nada', async () => {
    const svc = build();
    (
      svc as unknown as { periods: { findWithParent: jest.Mock } }
    ).periods.findWithParent = jest
      .fn()
      .mockResolvedValue({ ...MONTHS[3], parentPeriodId: null });
    expect(await closesCycle(svc, 'm4')).toBeNull();
  });

  it('un ciclo ya cerrado no se vuelve a ofrecer', async () => {
    // Ya se liquidó y se selló: `calculateCycle` lo rechazaría de todos modos.
    expect(await closesCycle(build({ cycleClosed: true }), 'm4')).toBeNull();
  });

  it('un ciclo sin meses no cierra nada', async () => {
    expect(await closesCycle(build({ months: [] }), 'm4')).toBeNull();
  });

  it('un ciclo corto lo cierra su último mes, no el cuarto', async () => {
    // El último mes es el que existe, no el número 4: un ciclo recortado (o a
    // medio sembrar) se cierra con el que tenga.
    const months = MONTHS.slice(0, 2);
    expect(await closesCycle(build({ months }), 'm2')).not.toBeNull();
    expect(await closesCycle(build({ months }), 'm4')).toBeNull();
  });
});
