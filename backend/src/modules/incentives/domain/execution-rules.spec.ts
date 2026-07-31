import {
  MONTHS_PER_CYCLE,
  execution20ModeFor,
  monthAchievementFraction,
  theoreticalMultiplierFor,
} from './execution-rules';

describe('execution-rules', () => {
  // La matriz completa: quién cobra el 20% y cuándo. Antes esta decisión se
  // tomaba con una lista de códigos de equipo quemada en el código, y los tres
  // códigos que buscaba NO EXISTÍAN en la base: los tres equipos que cobran
  // mensual venían liquidándose con el régimen del resto.
  describe('execution20ModeFor', () => {
    it('equipo mensual, mes normal: cobra su bolsa ese mes', () => {
      expect(execution20ModeFor(true, 'MONTH')).toBe('PAY_MONTHLY');
    });

    it('equipo mensual, cierre de ciclo: no cobra otra vez', () => {
      // Ya cobró mes a mes; pagarle también en el cierre sería duplicar.
      expect(execution20ModeFor(true, 'CYCLE')).toBe('NONE');
    });

    it('equipo normal, mes normal: solo devenga', () => {
      expect(execution20ModeFor(false, 'MONTH')).toBe('ACCRUE');
    });

    it('equipo normal, cierre de ciclo: cobra lo devengado', () => {
      expect(execution20ModeFor(false, 'CYCLE')).toBe('PAY_CYCLE');
    });
  });

  // El multiplicador TEÓRICO responde "¿cuánto llegaría a cobrar de 20% en el
  // ciclo si cumpliera todo?". Es el del escenario ideal, y no depende del
  // periodo: si dependiera, un mes de devengo mostraría un ideal de 0 y dejaría
  // el % de logro en null en todos los reportes.
  describe('theoreticalMultiplierFor', () => {
    it('un equipo mensual aspira a una bolsa por mes', () => {
      expect(theoreticalMultiplierFor(true)).toBe(1);
    });

    it('un equipo normal aspira al ciclo completo', () => {
      expect(theoreticalMultiplierFor(false)).toBe(MONTHS_PER_CYCLE);
    });

    it('nunca es 0: el ideal no puede anularse', () => {
      expect(theoreticalMultiplierFor(true)).toBeGreaterThan(0);
      expect(theoreticalMultiplierFor(false)).toBeGreaterThan(0);
    });
  });

  // Hay meses en que el 20% se mide con DOS KPIs. Ahí el mes deja de ser todo o
  // nada: cumplir uno de los dos gana la mitad de la bolsa del mes.
  describe('monthAchievementFraction', () => {
    it('un KPI cumplido gana el mes entero', () => {
      expect(monthAchievementFraction(1, true, false)).toBe(1);
    });

    it('un KPI no cumplido no gana nada', () => {
      expect(monthAchievementFraction(1, false, false)).toBe(0);
    });

    it('con un solo KPI, el segundo se ignora aunque venga marcado', () => {
      // Si el mes es de un KPI, un `meetsKpi2` residual no puede pagar de más.
      expect(monthAchievementFraction(1, false, true)).toBe(0);
      expect(monthAchievementFraction(1, true, true)).toBe(1);
    });

    it('dos KPIs, uno cumplido: media bolsa', () => {
      expect(monthAchievementFraction(2, true, false)).toBe(0.5);
      expect(monthAchievementFraction(2, false, true)).toBe(0.5);
    });

    it('dos KPIs, los dos cumplidos: la bolsa entera', () => {
      expect(monthAchievementFraction(2, true, true)).toBe(1);
    });

    it('dos KPIs, ninguno cumplido: nada', () => {
      expect(monthAchievementFraction(2, false, false)).toBe(0);
    });

    it('un kpiCount inesperado se trata como el régimen normal de un KPI', () => {
      // Dato corrupto o de una versión futura: pagar por un solo KPI es el
      // comportamiento conservador, no inventar fracciones.
      expect(monthAchievementFraction(0, true, true)).toBe(1);
      expect(monthAchievementFraction(3, true, false)).toBe(1);
    });
  });
});
