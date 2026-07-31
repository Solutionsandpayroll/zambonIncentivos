import {
  MONTHS_PER_CYCLE,
  execution20ModeFor,
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
});
