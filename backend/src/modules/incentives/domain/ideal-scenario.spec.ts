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
