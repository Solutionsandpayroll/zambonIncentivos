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
 *
 *  ── Sobre el porcentaje de logro ───────────────────────────────────────────
 *  `idealTotal` es el techo del CICLO, pero en los meses de acumulación el
 *  pago del 20% es 0: se registra el cumplimiento y se cobra al cierre. Medir
 *  ahí el logro contra el ideal completo dividía el pago de UN mes entre el
 *  ideal de CUATRO, y quien cumplía el 100% aparecía con ~50%.
 *
 *  Por eso el logro se mide solo contra la parte comparable: en un mes que
 *  acumula, contra `ideal80` —lo único que ese mes podía pagar—. El 20%
 *  devengado no se pierde: se reporta aparte y entra en el logro del cierre
 *  de ciclo, donde numerador y denominador vuelven a hablar de lo mismo.
 * ============================================================================
 */

export interface IdealScenarioInput {
  /** Bolsa teórica del 80% (salario base × rate80). */
  component80Theoretical: number;
  /** Bolsa teórica del 20% (salario base × rate20). */
  component20Theoretical: number;
  /** 4 por ciclo, 1 para los equipos que cobran el 20% mensual. */
  executionCycleMultiplier: number;
  /**
   * ¿Este resultado difiere el 20% al cierre del ciclo? True en los meses de
   * un equipo que acumula. Cuando lo es, el 20% no entra en el denominador del
   * logro porque tampoco entró en el numerador.
   *
   * Por defecto false: sin el dato, el logro se mide contra el ideal completo,
   * que es el comportamiento de un cierre de ciclo o de un equipo mensual.
   */
  defers20ToCycle?: boolean;
}

export interface IdealScenario {
  /** 80% si cumpliera el 100% de cada componente. */
  ideal80: number;
  /** 20% si cumpliera el KPI de ejecución. */
  ideal20: number;
  /** Total del escenario ideal: el techo contractual del ciclo. */
  idealTotal: number;
  /**
   * Base contra la que se midió el logro. Igual a `idealTotal`, salvo en los
   * meses que difieren el 20%, donde es solo `ideal80`. Se expone para que un
   * reporte pueda explicar el porcentaje en vez de dejarlo sin contexto.
   */
  achievementBase: number;
  /** Qué fracción de `achievementBase` se alcanzó (0..n). `null` si la base es 0. */
  achievementPercent: number | null;
  /**
   * ¿El logro excluye el 20% por estar diferido? Permite a la UI marcar el
   * porcentaje como "solo 80%" y evitar que se lea como el logro del ciclo.
   */
  achievementExcludes20: boolean;
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

  // El techo contractual no cambia; lo que cambia es contra qué se mide. Si el
  // 20% se difiere, este resultado no pudo pagarlo y sale del denominador.
  const achievementExcludes20 = input.defers20ToCycle === true;
  const achievementBase = achievementExcludes20 ? ideal80 : idealTotal;

  return {
    ideal80,
    ideal20,
    idealTotal,
    achievementBase,
    achievementExcludes20,
    // Sin base no hay porcentaje que calcular: devolver 0 sugeriría "no logró
    // nada" cuando en realidad no hay contra qué comparar.
    achievementPercent: achievementBase > 0 ? actualTotal / achievementBase : null,
  };
}
