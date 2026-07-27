import { Decimal } from '@prisma/client/runtime/library';
import { PayCurve, CurveStep } from './curve-pay';

const step = (min: number, pay: number, isCeiling = false): CurveStep => ({
  minCompliance: new Decimal(min),
  payPercent: new Decimal(pay),
  isCeiling,
});

describe('PayCurve', () => {
  // Curva del Excel: 90%→0.50, 100%→1.00, 120%→1.50 (tope).
  const curve = new PayCurve([
    step(0.9, 0.5),
    step(1.0, 1.0),
    step(1.2, 1.5, true),
  ]);

  it('paga 0 por debajo del primer escalón', () => {
    expect(curve.payPercentFor(new Decimal(0.5)).toNumber()).toBe(0);
    expect(curve.payPercentFor(new Decimal(0.8999)).toNumber()).toBe(0);
  });

  it('toma el escalón cuyo umbral es <= cumplimiento', () => {
    expect(curve.payPercentFor(new Decimal(0.9)).toNumber()).toBe(0.5);
    expect(curve.payPercentFor(new Decimal(0.95)).toNumber()).toBe(0.5);
    expect(curve.payPercentFor(new Decimal(1.0)).toNumber()).toBe(1.0);
    expect(curve.payPercentFor(new Decimal(1.15)).toNumber()).toBe(1.0);
  });

  it('aplica el tope superior (>120% no paga más que el ceiling)', () => {
    expect(curve.payPercentFor(new Decimal(1.2)).toNumber()).toBe(1.5);
    expect(curve.payPercentFor(new Decimal(2.0)).toNumber()).toBe(1.5);
  });

  it('ordena los escalones aunque lleguen desordenados', () => {
    const unsorted = new PayCurve([step(1.2, 1.5, true), step(0.9, 0.5), step(1.0, 1.0)]);
    expect(unsorted.payPercentFor(new Decimal(1.0)).toNumber()).toBe(1.0);
  });

  it('lanza error si no hay escalones', () => {
    expect(() => new PayCurve([])).toThrow();
  });
});
