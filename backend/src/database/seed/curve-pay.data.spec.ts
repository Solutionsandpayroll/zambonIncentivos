import { Decimal } from '@prisma/client/runtime/library';
import { OFFICIAL_CURVE_PAY } from './curve-pay.data';
import { PayCurve, CurveStep } from '../../modules/incentives/domain/curve-pay';

/**
 * Verifica que la curva oficial (calculocomisiones.xlsx) produce, a través del
 * motor real (PayCurve), los pagos esperados por el negocio. Es el puente entre
 * el dato migrado y la lógica de cálculo.
 */
describe('OFFICIAL_CURVE_PAY', () => {
  const curve = new PayCurve(
    OFFICIAL_CURVE_PAY.map(
      (s): CurveStep => ({
        minCompliance: new Decimal(s.minCompliancePercent),
        payPercent: new Decimal(s.payPercent),
        isCeiling: s.isCeiling ?? false,
      }),
    ),
  );

  const pay = (c: number) => curve.payPercentFor(new Decimal(c)).toNumber();

  it('tiene 31 escalones (0.90 … 1.20)', () => {
    expect(OFFICIAL_CURVE_PAY).toHaveLength(31);
    expect(OFFICIAL_CURVE_PAY[0].minCompliancePercent).toBe(0.9);
    expect(OFFICIAL_CURVE_PAY[30].minCompliancePercent).toBe(1.2);
  });

  it('no paga por debajo del 90% de cumplimiento', () => {
    expect(pay(0.5)).toBe(0);
    expect(pay(0.899)).toBe(0);
  });

  it('paga los escalones exactos del Excel', () => {
    expect(pay(0.9)).toBe(0.5);
    expect(pay(0.95)).toBe(0.75);
    expect(pay(1.0)).toBe(1.0); // cumplimiento pleno → pago pleno
    expect(pay(1.01)).toBe(1.03);
    expect(pay(1.1)).toBe(1.253333);
    expect(pay(1.19)).toBe(1.476667);
  });

  it('toma el escalón inferior para valores intermedios', () => {
    // 0.905 cae en el escalón 0.90; 1.005 en el 1.00
    expect(pay(0.905)).toBe(0.5);
    expect(pay(1.005)).toBe(1.0);
  });

  it('aplica el tope 1.50 desde 120% inclusive (decisión de negocio)', () => {
    expect(pay(1.2)).toBe(1.5);
    expect(pay(1.5)).toBe(1.5);
    expect(pay(3.0)).toBe(1.5);
  });

  it('el último escalón es el tope (isCeiling)', () => {
    expect(OFFICIAL_CURVE_PAY[30].isCeiling).toBe(true);
    expect(OFFICIAL_CURVE_PAY[30].payPercent).toBe(1.5);
  });

  it('los umbrales son estrictamente crecientes y sin repetidos', () => {
    for (let i = 1; i < OFFICIAL_CURVE_PAY.length; i++) {
      expect(OFFICIAL_CURVE_PAY[i].minCompliancePercent).toBeGreaterThan(
        OFFICIAL_CURVE_PAY[i - 1].minCompliancePercent,
      );
    }
  });
});
