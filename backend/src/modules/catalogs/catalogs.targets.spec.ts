import { CatalogsService } from './catalogs.service';
import { SetTargetsDto } from './dto/targets.dto';

/**
 * Reglas del cargue de cuotas: periodo debe existir y estar abierto; upsert por
 * (empleado, componente, periodo). Prisma y AuditService mockeados.
 */
describe('CatalogsService.setTargets', () => {
  function makeService(period: any) {
    const upsert = jest.fn().mockResolvedValue({});
    const prisma = {
      period: { findUnique: jest.fn().mockResolvedValue(period) },
      teamComponentTarget: { upsert, findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
    };
    return {
      service: new CatalogsService(prisma as never, { record: jest.fn() } as never),
      prisma,
      upsert,
    };
  }

  const dto: SetTargetsDto = {
    periodId: 'p1',
    targets: [
      { employeeId: 'e1', componentId: 'c1', quotaValue: 1000 },
      { employeeId: 'e2', componentId: 'c1', quotaValue: 2000 },
    ],
  };

  it('hace upsert de cada cuota en un periodo abierto', async () => {
    const { service, prisma } = makeService({ periodId: 'p1', isClosed: false });
    await service.setTargets(dto);
    // Se arma una operación de upsert por cada cuota.
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const ops = prisma.$transaction.mock.calls[0][0];
    expect(ops).toHaveLength(2);
  });

  it('rechaza cargar cuotas en un periodo cerrado (422)', async () => {
    const { service } = makeService({ periodId: 'p1', isClosed: true });
    await expect(service.setTargets(dto)).rejects.toThrow(/cerrado/i);
  });

  it('falla si el periodo no existe (404)', async () => {
    const { service } = makeService(null);
    await expect(service.setTargets(dto)).rejects.toThrow(/no existe/i);
  });
});
