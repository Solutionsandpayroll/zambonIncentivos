import { Decimal } from '@prisma/client/runtime/library';

/**
 * Un escalón de la curva de pago: a partir de `minCompliance` (inclusive) se
 * paga `payPercent`. `isCeiling` marca la fila ">120%" (tope superior).
 */
export interface CurveStep {
  minCompliance: Decimal;
  payPercent: Decimal;
  isCeiling: boolean;
}

/**
 * Curva de pago de un periodo (opcionalmente por componente). Traduce un
 * `% de cumplimiento` (venta/cuota) en un `% de comisión` a pagar.
 *
 * Semántica (schema.prisma + USECASES §0): se toma el escalón de mayor
 * `minCompliance` que sea <= cumplimiento. Por debajo del primer escalón el
 * pago es 0. El escalón `isCeiling` acota por arriba (sobrecumplimiento no
 * paga más que el tope).
 */
export class PayCurve {
  private readonly steps: CurveStep[];

  constructor(steps: CurveStep[]) {
    if (steps.length === 0) {
      throw new Error('La curva de pago no tiene escalones definidos');
    }
    // Orden ascendente por umbral de cumplimiento.
    this.steps = [...steps].sort((a, b) =>
      a.minCompliance.comparedTo(b.minCompliance),
    );
  }

  /**
   * Devuelve el % de pago para un cumplimiento dado.
   * @param compliance venta/cuota (p. ej. 0.8148 = 81.48%)
   */
  payPercentFor(compliance: Decimal): Decimal {
    let selected: CurveStep | null = null;

    for (const step of this.steps) {
      if (compliance.greaterThanOrEqualTo(step.minCompliance)) {
        selected = step;
      } else {
        break; // los siguientes umbrales son mayores; ya no aplican
      }
    }

    // Por debajo del primer escalón: no paga.
    if (!selected) return new Decimal(0);
    return selected.payPercent;
  }
}
