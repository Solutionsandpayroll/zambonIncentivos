import { computeIdealScenario } from './ideal-scenario';

describe('computeIdealScenario', () => {
  it('ideal = bolsa80 + bolsa20 × multiplicador (caso real de ciclo)', () => {
    // Header real del periodo 2026-01.
    const r = computeIdealScenario(
      {
        component80Theoretical: 744576,
        component20Theoretical: 186144,
        executionCycleMultiplier: 4,
      },
      0,
    );
    expect(r.ideal80).toBe(744576);
    expect(r.ideal20).toBe(744576); // 186.144 × 4
    expect(r.idealTotal).toBe(1489152);
  });

  it('respeta el multiplicador mensual (KAMS y directores, ×1)', () => {
    const r = computeIdealScenario(
      {
        component80Theoretical: 2640000,
        component20Theoretical: 660000,
        executionCycleMultiplier: 1,
      },
      0,
    );
    expect(r.ideal20).toBe(660000);
    expect(r.idealTotal).toBe(3300000);
  });

  it('calcula el porcentaje de logro contra lo realmente pagado', () => {
    const r = computeIdealScenario(
      {
        component80Theoretical: 1000,
        component20Theoretical: 250,
        executionCycleMultiplier: 4,
      },
      1000, // pagó 1000 de un ideal de 2000
    );
    expect(r.idealTotal).toBe(2000);
    expect(r.achievementPercent).toBe(0.5);
  });

  it('el sobrecumplimiento puede superar el 100% del ideal', () => {
    // El ideal es el 100% exacto; quien sobrecumple en el 80% lo supera.
    const r = computeIdealScenario(
      { component80Theoretical: 800, component20Theoretical: 200, executionCycleMultiplier: 1 },
      1200,
    );
    expect(r.achievementPercent).toBe(1.2);
  });

  it('un mes que acumula mide el logro solo contra el 80%', () => {
    // Cumplió el 100% del 80% pero el 20% se difiere al cierre: el pago del mes
    // es 1000 y el logro debe ser 100%, no 50%.
    const r = computeIdealScenario(
      {
        component80Theoretical: 1000,
        component20Theoretical: 250,
        executionCycleMultiplier: 4,
        defers20ToCycle: true,
      },
      1000,
    );
    // El techo contractual del ciclo NO cambia: sigue siendo comparable.
    expect(r.idealTotal).toBe(2000);
    // Pero la base del logro es solo el 80%.
    expect(r.achievementBase).toBe(1000);
    expect(r.achievementPercent).toBe(1);
    expect(r.achievementExcludes20).toBe(true);
  });

  it('el cierre de ciclo vuelve a medir contra el ideal completo', () => {
    // En el cierre el numerador ya trae las bolsas acumuladas: ambos lados
    // hablan del ciclo entero.
    const r = computeIdealScenario(
      {
        component80Theoretical: 1000,
        component20Theoretical: 250,
        executionCycleMultiplier: 4,
        defers20ToCycle: false,
      },
      2000,
    );
    expect(r.achievementBase).toBe(2000);
    expect(r.achievementPercent).toBe(1);
    expect(r.achievementExcludes20).toBe(false);
  });

  it('un equipo mensual nunca difiere: base = ideal completo', () => {
    const r = computeIdealScenario(
      {
        component80Theoretical: 800,
        component20Theoretical: 200,
        executionCycleMultiplier: 1,
        defers20ToCycle: false,
      },
      1000,
    );
    expect(r.achievementBase).toBe(1000);
    expect(r.achievementPercent).toBe(1);
  });

  it('sin el dato de diferimiento mide contra el ideal completo', () => {
    // Compatibilidad: omitir la bandera conserva el comportamiento anterior.
    const r = computeIdealScenario(
      { component80Theoretical: 1000, component20Theoretical: 250, executionCycleMultiplier: 4 },
      1000,
    );
    expect(r.achievementBase).toBe(2000);
    expect(r.achievementPercent).toBe(0.5);
    expect(r.achievementExcludes20).toBe(false);
  });

  it('un mes diferido sin bolsa de 80% no inventa un logro', () => {
    const r = computeIdealScenario(
      {
        component80Theoretical: 0,
        component20Theoretical: 250,
        executionCycleMultiplier: 4,
        defers20ToCycle: true,
      },
      0,
    );
    expect(r.idealTotal).toBe(1000);
    // La base es 0 aunque el ideal no lo sea: no hay contra qué medir.
    expect(r.achievementPercent).toBeNull();
  });

  it('sin ideal devuelve null, no 0 (no hay contra qué comparar)', () => {
    const r = computeIdealScenario(
      { component80Theoretical: 0, component20Theoretical: 0, executionCycleMultiplier: 4 },
      0,
    );
    expect(r.idealTotal).toBe(0);
    expect(r.achievementPercent).toBeNull();
  });

  it('multiplicador ausente no rompe el cálculo', () => {
    const r = computeIdealScenario(
      { component80Theoretical: 500, component20Theoretical: 100, executionCycleMultiplier: 0 },
      0,
    );
    expect(r.ideal20).toBe(0);
    expect(r.idealTotal).toBe(500);
  });
});
