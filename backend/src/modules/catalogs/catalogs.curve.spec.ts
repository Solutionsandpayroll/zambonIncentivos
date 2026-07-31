import { CatalogsService } from './catalogs.service';
import { SetCurvePayDto } from './dto/curve-pay.dto';

/**
 * Validaciones del cargue de curva de pago. Prisma y AuditService mockeados
 * (aquí no interesa la persistencia real, sí las reglas).
 */
describe('CatalogsService.setCurvePay', () => {
  function makeService(period: any) {
    const tx = {
      curvePay: {
        deleteMany: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const prisma = {
      period: { findUnique: jest.fn().mockResolvedValue(period) },
      $transaction: jest.fn((cb: any) => cb(tx)),
    };
    const audit = { record: jest.fn() };
    const periods = { resolveParameterPeriodIds: jest.fn().mockResolvedValue(['p1']) };
    return {
      service: new CatalogsService(prisma as never, audit as never, periods as never),
      prisma,
      tx,
    };
  }

  const openPeriod = { periodId: 'p1', isClosed: false };

  function dto(steps: SetCurvePayDto['steps']): SetCurvePayDto {
    return { periodId: 'p1', componentId: null, steps };
  }

  it('carga escalones válidos y reemplaza los previos', async () => {
    const { service, tx } = makeService(openPeriod);
    await service.setCurvePay(
      dto([
        { minCompliancePercent: 0.9, payPercent: 0.5 },
        { minCompliancePercent: 1.0, payPercent: 1.0 },
        { minCompliancePercent: 1.2, payPercent: 1.5, isCeiling: true },
      ]),
    );
    expect(tx.curvePay.deleteMany).toHaveBeenCalledWith({
      where: { periodId: 'p1', componentId: null },
    });
    expect(tx.curvePay.createMany).toHaveBeenCalledTimes(1);
    const created = tx.curvePay.createMany.mock.calls[0][0].data;
    expect(created).toHaveLength(3);
  });

  it('rechaza umbrales de cumplimiento repetidos (422)', async () => {
    const { service } = makeService(openPeriod);
    await expect(
      service.setCurvePay(
        dto([
          { minCompliancePercent: 1.0, payPercent: 1.0 },
          { minCompliancePercent: 1.0, payPercent: 1.2 },
        ]),
      ),
    ).rejects.toThrow(/repetido/i);
  });

  it('rechaza cargar sobre un periodo cerrado (422)', async () => {
    const { service } = makeService({ periodId: 'p1', isClosed: true });
    await expect(
      service.setCurvePay(dto([{ minCompliancePercent: 1.0, payPercent: 1.0 }])),
    ).rejects.toThrow(/cerrado/i);
  });

  it('falla si el periodo no existe (404)', async () => {
    const { service } = makeService(null);
    await expect(
      service.setCurvePay(dto([{ minCompliancePercent: 1.0, payPercent: 1.0 }])),
    ).rejects.toThrow(/no existe/i);
  });
});
