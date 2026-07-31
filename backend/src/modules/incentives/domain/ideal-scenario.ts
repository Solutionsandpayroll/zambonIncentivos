/**
 * ============================================================================
 *  Escenario ideal: cuánto ganaría la persona si cumpliera exactamente el 100%.
 *
 *  Definición (dominio puro, sin Nest/Prisma):
 *
 *      ideal = bolsa80 × 1.0  +  bolsa20 × multiplicador de ciclo
 *
 *  Al 100% de cumplimiento la curva paga 1.0 (verificado contra la curva
 *  oficial), y como los pesos de los componentes suman 1.0, el 80% ideal es la
 *  bolsa teórica completa. El 20% es booleano, así que su ideal es cobrarlo
 *  entero.
 *
 *  Es un IDEAL PURO: ignora el pago garantizado y el cumplimiento del KPI a
 *  propósito. Representa el techo contractual de la persona —lo que ganaría
 *  cumpliendo todo— y por eso es comparable entre personas y entre periodos.
 *  Si respetara las excepciones, dos personas con el mismo cargo tendrían
 *  "ideales" distintos y la comparación dejaría de significar nada.
 * ============================================================================
 */

export interface IdealScenarioInput {
  /** Bolsa teórica del 80% (salario base × rate80). */
  component80Theoretical: number;
  /** Bolsa teórica del 20% (salario base × rate20). */
  component20Theoretical: number;
  /** 4 por ciclo, 1 para los equipos que cobran el 20% mensual. */
  executionCycleMultiplier: number;
}

export interface IdealScenario {
  /** 80% si cumpliera el 100% de cada componente. */
  ideal80: number;
  /** 20% si cumpliera el KPI de ejecución. */
  ideal20: number;
  /** Total del escenario ideal. */
  idealTotal: number;
  /** Qué fracción del ideal se alcanzó (0..n). `null` si el ideal es 0. */
  achievementPercent: number | null;
}

/** Redondeo a centavos, igual que el motor. */
const money = (n: number): number => Math.round(n * 100) / 100;

export function computeIdealScenario(
  input: IdealScenarioInput,
  actualTotal: number,
): IdealScenario {
  const ideal80 = money(input.component80Theoretical);
  const ideal20 = money(
    input.component20Theoretical * (input.executionCycleMultiplier || 0),
  );
  const idealTotal = money(ideal80 + ideal20);

  return {
    ideal80,
    ideal20,
    idealTotal,
    // Sin ideal no hay porcentaje que calcular: devolver 0 sugeriría "no logró
    // nada" cuando en realidad no hay contra qué comparar.
    achievementPercent: idealTotal > 0 ? actualTotal / idealTotal : null,
  };
}
