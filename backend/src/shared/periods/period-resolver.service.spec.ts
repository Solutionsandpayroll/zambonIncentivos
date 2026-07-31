import { PeriodResolverService } from './period-resolver.service';

function makePrisma(period: unknown) {
  return {
    period: {
      findUnique: jest.fn().mockResolvedValue(period),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  } as never;
}

describe('PeriodResolverService', () => {
  describe('resolveParameterPeriodIds', () => {
    it('un mes CON ciclo devuelve [mes, ciclo] en ese orden', async () => {
      const svc = new PeriodResolverService(
        makePrisma({ periodId: 'm1', parentPeriodId: 'c1' }),
      );
      // El orden importa: el primero es el que prevalece.
      expect(await svc.resolveParameterPeriodIds('m1')).toEqual(['m1', 'c1']);
    });

    it('un mes SIN ciclo devuelve solo [mes] — compatibilidad hacia atrás', async () => {
      const svc = new PeriodResolverService(
        makePrisma({ periodId: 'm1', parentPeriodId: null }),
      );
      expect(await svc.resolveParameterPeriodIds('m1')).toEqual(['m1']);
    });

    it('un ciclo se devuelve a sí mismo', async () => {
      const svc = new PeriodResolverService(
        makePrisma({ periodId: 'c1', parentPeriodId: null }),
      );
      expect(await svc.resolveParameterPeriodIds('c1')).toEqual(['c1']);
    });

    it('un periodo inexistente devuelve vacío, no lanza', async () => {
      const svc = new PeriodResolverService(makePrisma(null));
      expect(await svc.resolveParameterPeriodIds('nope')).toEqual([]);
    });
  });

  describe('hasClosedMonths', () => {
    it('es true si algún mes del ciclo está cerrado', async () => {
      const prisma = makePrisma(null) as never as {
        period: { count: jest.Mock };
      };
      prisma.period.count.mockResolvedValue(1);
      const svc = new PeriodResolverService(prisma as never);
      expect(await svc.hasClosedMonths('c1')).toBe(true);
    });

    it('es false si ninguno lo está', async () => {
      const svc = new PeriodResolverService(makePrisma(null));
      expect(await svc.hasClosedMonths('c1')).toBe(false);
    });
  });
});
