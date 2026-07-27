import { AuditService, AuditAction } from './audit.service';

/**
 * El AuditService es best-effort: registrar la bitácora NUNCA debe tumbar la
 * operación de negocio. Verificamos ese contrato con un mock de Prisma.
 */
describe('AuditService', () => {
  function makeService(createImpl: () => Promise<unknown>) {
    const create = jest.fn(createImpl) as jest.Mock;
    const prisma = { adminAuditLog: { create, findMany: jest.fn() } };
    return { service: new AuditService(prisma as never), create };
  }

  it('persiste una entrada con los campos dados', async () => {
    const { service, create } = makeService(() => Promise.resolve({}));
    await service.record({
      action: AuditAction.REPROCESS,
      entityType: 'incentive_calculation_header',
      periodId: 'p1',
      reason: 'corrección de cuota',
    });

    expect(create).toHaveBeenCalledTimes(1);
    const arg = create.mock.calls[0][0];
    expect(arg.data.action).toBe('REPROCESS');
    expect(arg.data.periodId).toBe('p1');
    expect(arg.data.reason).toBe('corrección de cuota');
  });

  it('NO propaga el error si la escritura de la bitácora falla', async () => {
    const { service } = makeService(() => Promise.reject(new Error('DB caída')));
    await expect(
      service.record({
        action: AuditAction.PERIOD_CLOSE,
        entityType: 'period',
        periodId: 'p1',
      }),
    ).resolves.toBeUndefined();
  });

  it('normaliza los opcionales ausentes a null', async () => {
    const { service, create } = makeService(() => Promise.resolve({}));
    await service.record({
      action: AuditAction.NOVELTY_CREATE,
      entityType: 'absence_or_novelty',
    });
    const arg = create.mock.calls[0][0];
    expect(arg.data.userId).toBeNull();
    expect(arg.data.username).toBeNull();
    expect(arg.data.entityId).toBeNull();
  });
});
