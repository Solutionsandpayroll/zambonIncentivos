import {
  preferMonthOverCycle,
  preferMonthOverCycleTagged,
} from './parameter-precedence';

interface Weight {
  teamId: string;
  componentCode: string;
  weight: number;
}

const w = (teamId: string, componentCode: string, weight: number): Weight => ({
  teamId,
  componentCode,
  weight,
});

const byTeam = (r: Weight) => r.teamId;

describe('preferMonthOverCycle', () => {
  it('sin filas del mes, hereda todo el ciclo', () => {
    const cycle = [w('t1', 'FLUI', 0.5), w('t1', 'MONU', 0.5)];
    expect(preferMonthOverCycle([], cycle, byTeam)).toEqual(cycle);
  });

  it('sin filas del ciclo, usa las del mes', () => {
    const month = [w('t1', 'FLUI', 1)];
    expect(preferMonthOverCycle(month, [], byTeam)).toEqual(month);
  });

  it('el mes gana ENTERO para su clave: nunca mezcla con el ciclo', () => {
    // El ciclo define 3 componentes; el mes redefine solo 2. El resultado deben
    // ser los 2 del mes, NO 3 mezclados: los pesos de un equipo suman 1.0 y una
    // mezcla daría 1.5, que el backend rechazaría con 422.
    const cycle = [w('t1', 'FLUI', 0.5), w('t1', 'MONU', 0.3), w('t1', 'FLUTOX', 0.2)];
    const month = [w('t1', 'FLUI', 0.6), w('t1', 'MONU', 0.4)];

    const result = preferMonthOverCycle(month, cycle, byTeam);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.componentCode).sort()).toEqual(['FLUI', 'MONU']);
    expect(result.reduce((a, r) => a + r.weight, 0)).toBeCloseTo(1);
  });

  it('cada clave se resuelve por separado', () => {
    // El mes solo redefine el equipo 1; el equipo 2 sigue heredando del ciclo.
    const cycle = [w('t1', 'FLUI', 1), w('t2', 'PANO', 1)];
    const month = [w('t1', 'MONU', 1)];

    const result = preferMonthOverCycle(month, cycle, byTeam);

    expect(result).toHaveLength(2);
    expect(result.find((r) => r.teamId === 't1')!.componentCode).toBe('MONU');
    expect(result.find((r) => r.teamId === 't2')!.componentCode).toBe('PANO');
  });

  it('ambos vacíos devuelve vacío', () => {
    expect(preferMonthOverCycle<Weight>([], [], byTeam)).toEqual([]);
  });

  it('agrupa la curva por componente, con null como GLOBAL', () => {
    interface Step { componentId: string | null; min: number }
    const key = (s: Step) => s.componentId ?? 'GLOBAL';
    const cycle: Step[] = [{ componentId: null, min: 0.9 }, { componentId: 'c1', min: 0.8 }];
    const month: Step[] = [{ componentId: null, min: 0.95 }];

    const result = preferMonthOverCycle(month, cycle, key);

    // El mes redefine la curva global; la de c1 sigue viniendo del ciclo.
    expect(result).toHaveLength(2);
    expect(result.find((s) => s.componentId === null)!.min).toBe(0.95);
    expect(result.find((s) => s.componentId === 'c1')!.min).toBe(0.8);
  });
});

describe('preferMonthOverCycleTagged', () => {
  it('marca el origen de cada fila', () => {
    const cycle = [w('t1', 'FLUI', 1), w('t2', 'PANO', 1)];
    const month = [w('t1', 'MONU', 1)];

    const result = preferMonthOverCycleTagged(month, cycle, byTeam);

    expect(result.find((r) => r.teamId === 't1')!.source).toBe('MONTH');
    expect(result.find((r) => r.teamId === 't2')!.source).toBe('CYCLE');
  });
});
