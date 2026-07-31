import {
  buildYearCalendar,
  cycleBounds,
  cycleNumberForMonth,
  lastMonthOfCycle,
  monthEnd,
  monthStart,
  periodLabel,
} from './period-calendar';

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('cycleNumberForMonth', () => {
  it('agrupa de cuatro en cuatro', () => {
    expect([1, 2, 3, 4].map(cycleNumberForMonth)).toEqual([1, 1, 1, 1]);
    expect([5, 6, 7, 8].map(cycleNumberForMonth)).toEqual([2, 2, 2, 2]);
    expect([9, 10, 11, 12].map(cycleNumberForMonth)).toEqual([3, 3, 3, 3]);
  });
});

describe('lastMonthOfCycle', () => {
  it('es 4, 8 y 12', () => {
    expect([1, 2, 3].map(lastMonthOfCycle)).toEqual([4, 8, 12]);
  });
});

describe('fechas en UTC', () => {
  it('el mes empieza el 1 y termina el último día', () => {
    expect(iso(monthStart(2026, 3))).toBe('2026-03-01');
    expect(iso(monthEnd(2026, 3))).toBe('2026-03-31');
  });

  it('febrero de un año NO bisiesto termina el 28', () => {
    expect(iso(monthEnd(2026, 2))).toBe('2026-02-28');
  });

  it('febrero de un año bisiesto termina el 29', () => {
    expect(iso(monthEnd(2024, 2))).toBe('2024-02-29');
  });

  it('diciembre termina el 31, sin saltar de año', () => {
    expect(iso(monthEnd(2026, 12))).toBe('2026-12-31');
  });
});

describe('cycleBounds', () => {
  it('Ciclo1 abarca enero a abril', () => {
    const [a, b] = cycleBounds(2026, 1);
    expect([iso(a), iso(b)]).toEqual(['2026-01-01', '2026-04-30']);
  });

  it('Ciclo2 abarca mayo a agosto', () => {
    const [a, b] = cycleBounds(2026, 2);
    expect([iso(a), iso(b)]).toEqual(['2026-05-01', '2026-08-31']);
  });

  it('Ciclo3 abarca septiembre a diciembre', () => {
    const [a, b] = cycleBounds(2026, 3);
    expect([iso(a), iso(b)]).toEqual(['2026-09-01', '2026-12-31']);
  });
});

describe('buildYearCalendar', () => {
  const cal = buildYearCalendar(2026);

  it('son 15 periodos: 3 ciclos y 12 meses', () => {
    expect(cal).toHaveLength(15);
    expect(cal.filter((p) => p.periodType === 'CYCLE')).toHaveLength(3);
    expect(cal.filter((p) => p.periodType === 'MONTH')).toHaveLength(12);
  });

  it('los ciclos van primero: los meses necesitan su id para enlazarse', () => {
    expect(cal.slice(0, 3).every((p) => p.periodType === 'CYCLE')).toBe(true);
  });

  it('el periodMonth de un ciclo es su último mes', () => {
    const cycles = cal.filter((p) => p.periodType === 'CYCLE');
    expect(cycles.map((c) => c.periodMonth)).toEqual([4, 8, 12]);
  });

  it('un ciclo y su último mes conviven sin chocar en la clave única', () => {
    // (2026, 4, CYCLE) y (2026, 4, MONTH) son filas distintas.
    const same = cal.filter((p) => p.periodMonth === 4);
    expect(same).toHaveLength(2);
    expect(same.map((p) => p.periodType).sort()).toEqual(['CYCLE', 'MONTH']);
  });

  it('cada mes apunta a su ciclo', () => {
    const abril = cal.find((p) => p.periodType === 'MONTH' && p.periodMonth === 4)!;
    const mayo = cal.find((p) => p.periodType === 'MONTH' && p.periodMonth === 5)!;
    expect(abril.parentCycleNumber).toBe(1);
    expect(mayo.parentCycleNumber).toBe(2);
  });

  it('los ciclos no tienen padre y los meses no tienen cycleNumber', () => {
    cal.forEach((p) => {
      if (p.periodType === 'CYCLE') {
        expect(p.parentCycleNumber).toBeNull();
        expect(p.cycleNumber).not.toBeNull();
      } else {
        expect(p.cycleNumber).toBeNull();
        expect(p.parentCycleNumber).not.toBeNull();
      }
    });
  });

  it('los 4 meses de un ciclo caben exactamente en sus límites', () => {
    const [ini, fin] = cycleBounds(2026, 2);
    const meses = cal.filter((p) => p.periodType === 'MONTH' && p.parentCycleNumber === 2);
    expect(meses).toHaveLength(4);
    expect(iso(meses[0].startDate)).toBe(iso(ini));
    expect(iso(meses[3].endDate)).toBe(iso(fin));
  });
});

describe('periodLabel', () => {
  it('un mes se lee como año-mes', () => {
    expect(periodLabel({ periodYear: 2026, periodMonth: 3, periodType: 'MONTH', cycleNumber: null }))
      .toBe('2026-03');
  });

  it('un ciclo nombra su rango, no su periodMonth', () => {
    // '2026-04 · Ciclo' se leería como un ciclo de abril; abarca ene–abr.
    expect(periodLabel({ periodYear: 2026, periodMonth: 4, periodType: 'CYCLE', cycleNumber: 1 }))
      .toBe('2026 · Ciclo 1 (ene–abr)');
    expect(periodLabel({ periodYear: 2026, periodMonth: 12, periodType: 'CYCLE', cycleNumber: 3 }))
      .toBe('2026 · Ciclo 3 (sep–dic)');
  });
});
