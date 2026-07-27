import { Decimal } from '@prisma/client/runtime/library';
import {
  consolidate,
  latestVersionOnly,
  CalculationRow,
} from './aggregation';

const d = (n: number) => new Decimal(n);

function row(over: Partial<CalculationRow>): CalculationRow {
  return {
    employeeId: 'e1',
    periodId: 'p1',
    calculationVersion: 1,
    component80Result: d(800),
    component20Result: d(200),
    totalIncentive: d(1000),
    guaranteedPayApplied: false,
    ...over,
  };
}

describe('latestVersionOnly', () => {
  it('conserva la versión mayor por empleado/periodo', () => {
    const rows = [
      row({ employeeId: 'e1', calculationVersion: 1, totalIncentive: d(1000) }),
      row({ employeeId: 'e1', calculationVersion: 2, totalIncentive: d(1500) }),
      row({ employeeId: 'e1', calculationVersion: 3, totalIncentive: d(1200) }),
    ];
    const latest = latestVersionOnly(rows);
    expect(latest).toHaveLength(1);
    expect(latest[0].calculationVersion).toBe(3);
    expect(latest[0].totalIncentive.toNumber()).toBe(1200);
  });

  it('separa versiones por empleado y por periodo', () => {
    const rows = [
      row({ employeeId: 'e1', periodId: 'p1', calculationVersion: 2 }),
      row({ employeeId: 'e2', periodId: 'p1', calculationVersion: 1 }),
      row({ employeeId: 'e1', periodId: 'p2', calculationVersion: 1 }),
    ];
    expect(latestVersionOnly(rows)).toHaveLength(3);
  });
});

describe('consolidate', () => {
  it('suma solo la versión vigente (no las históricas)', () => {
    // e1 tiene 3 versiones; solo la v3 (1200) debe contar.
    const rows = [
      row({ employeeId: 'e1', calculationVersion: 1, component80Result: d(800), component20Result: d(200), totalIncentive: d(1000) }),
      row({ employeeId: 'e1', calculationVersion: 3, component80Result: d(900), component20Result: d(300), totalIncentive: d(1200) }),
      row({ employeeId: 'e1', calculationVersion: 2, component80Result: d(850), component20Result: d(250), totalIncentive: d(1100) }),
    ];
    const t = consolidate(rows);
    expect(t.employeeCount).toBe(1);
    expect(t.total80.toNumber()).toBe(900);
    expect(t.total20.toNumber()).toBe(300);
    expect(t.totalIncentive.toNumber()).toBe(1200);
  });

  it('suma varios empleados', () => {
    const rows = [
      row({ employeeId: 'e1', totalIncentive: d(1000), component80Result: d(800), component20Result: d(200) }),
      row({ employeeId: 'e2', totalIncentive: d(1500), component80Result: d(1200), component20Result: d(300) }),
    ];
    const t = consolidate(rows);
    expect(t.employeeCount).toBe(2);
    expect(t.total80.toNumber()).toBe(2000);
    expect(t.total20.toNumber()).toBe(500);
    expect(t.totalIncentive.toNumber()).toBe(2500);
  });

  it('cuenta cuántos tienen pago garantizado', () => {
    const rows = [
      row({ employeeId: 'e1', guaranteedPayApplied: true }),
      row({ employeeId: 'e2', guaranteedPayApplied: false }),
      row({ employeeId: 'e3', guaranteedPayApplied: true }),
    ];
    expect(consolidate(rows).guaranteedCount).toBe(2);
  });

  it('devuelve ceros para un conjunto vacío (alcance sin datos)', () => {
    const t = consolidate([]);
    expect(t.employeeCount).toBe(0);
    expect(t.totalIncentive.toNumber()).toBe(0);
    expect(t.guaranteedCount).toBe(0);
  });
});
