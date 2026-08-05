import { HomeService } from './home.service';
import { AppRole, ScopeType } from '../../common/constants/roles';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

/**
 * El resumen de home debe ramificar por rol: ADMIN/NÓMINA ven el bloque `staff`
 * (estado global); el resto ve el bloque `employee` (su liquidación). Verificamos
 * esa ramificación con Prisma y ScopeService mockeados.
 */
describe('HomeService', () => {
  const activePeriod = {
    periodId: 'p1',
    periodYear: 2025,
    periodMonth: 5,
    periodType: 'MONTH',
  };

  function makeService(overrides: Record<string, any> = {}) {
    const prisma = {
      period: {
        findFirst: jest.fn().mockResolvedValue(activePeriod),
        findMany: jest.fn().mockResolvedValue([activePeriod]),
        count: jest.fn().mockResolvedValue(2),
      },
      salesUploadBatch: { count: jest.fn().mockResolvedValue(0) },
      team: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ teamId: 't1', teamName: 'Equipo A' }]),
      },
      employeeTeamAssignment: { count: jest.fn().mockResolvedValue(5) },
      incentiveCalculationHeader: {
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(3),
        findMany: jest.fn().mockResolvedValue([{ employeeId: 'e1' }, { employeeId: 'e2' }]),
      },
      ...overrides,
    };
    const scope = {
      allowedEmployeeIds: jest.fn().mockReturnValue(['e1']),
    };
    return { service: new HomeService(prisma as never, scope as never), prisma };
  }

  function user(roles: string[], scopeType: ScopeType, employeeId: string | null): AuthenticatedUser {
    return {
      userId: 'u1',
      username: 'x',
      employeeId,
      roles,
      scope: { type: scopeType, subordinateEmployeeIds: [] },
    };
  }

  it('ADMIN recibe el bloque staff con el estado global', async () => {
    const { service } = makeService();
    const res: any = await service.summary(
      user([AppRole.ADMIN], ScopeType.ALL, null),
    );
    expect(res.staff).toBeDefined();
    expect(res.employee).toBeUndefined();
    expect(res.staff.openPeriods).toBe(2);
    expect(res.staff.settlementsActivePeriod).toBe(3);
    expect(res.activePeriod.periodId).toBe('p1');
  });

  it('incluye el avance por equipo (calculados/total) para staff', async () => {
    const { service } = makeService();
    const res: any = await service.summary(
      user([AppRole.ADMIN], ScopeType.ALL, null),
    );
    expect(res.staff.teamProgress).toHaveLength(1);
    expect(res.staff.teamProgress[0]).toMatchObject({
      teamName: 'Equipo A',
      calculated: 2,
      total: 5,
    });
  });

  it('EMPLEADO recibe el bloque employee (su liquidación)', async () => {
    const { service } = makeService({
      incentiveCalculationHeader: {
        findFirst: jest.fn().mockResolvedValue({
          incentiveCalculationHeaderId: 'h1',
          totalIncentive: 1000,
          calculationVersion: 1,
          calculatedAt: new Date('2025-06-01'),
          period: { periodYear: 2025, periodMonth: 5 },
        }),
        count: jest.fn(),
      },
    });
    const res: any = await service.summary(
      user([AppRole.EMPLEADO], ScopeType.SELF, 'e1'),
    );
    expect(res.employee).toBeDefined();
    expect(res.staff).toBeUndefined();
    expect(res.employee.lastSettlement.headerId).toBe('h1');
    expect(res.employee.lastSettlement.period).toBe('2025-05');
  });

  it('maneja la ausencia de periodo activo sin romper', async () => {
    const { service } = makeService({
      period: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    });
    const res: any = await service.summary(
      user([AppRole.NOMINA], ScopeType.ALL, null),
    );
    expect(res.activePeriod).toBeNull();
    expect(res.staff.settlementsActivePeriod).toBe(0);
  });
});
