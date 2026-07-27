import { Decimal } from '@prisma/client/runtime/library';
import { ReportsService } from './reports.service';
import { ScopeType } from '../../common/constants/roles';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

/**
 * Verifica que el consolidado propaga TODOS los filtros (incluidos los nuevos
 * zona y componente) al repository y respeta el alcance. Repo/scope mockeados.
 */
describe('ReportsService.consolidatedReport', () => {
  function makeService(allowed: string[] | null = null) {
    const repo = {
      findHeaders: jest.fn().mockResolvedValue([]),
    };
    const scope = {
      allowedEmployeeIds: jest.fn().mockReturnValue(allowed),
    };
    const service = new ReportsService(
      repo as never,
      scope as never,
      {} as never,
      {} as never,
    );
    return { service, repo, scope };
  }

  const adminUser: AuthenticatedUser = {
    userId: 'u1',
    username: 'admin',
    employeeId: null,
    roles: ['ADMIN'],
    scope: { type: ScopeType.ALL, subordinateEmployeeIds: [] },
  };

  it('propaga periodo, equipo, zona y componente al repository', async () => {
    const { service, repo } = makeService(null);
    await service.consolidatedReport(adminUser, {
      periodId: 'p1',
      teamId: 't1',
      zoneId: 'z1',
      componentId: 'c1',
    });

    expect(repo.findHeaders).toHaveBeenCalledWith(
      expect.objectContaining({
        periodId: 'p1',
        teamId: 't1',
        zoneId: 'z1',
        componentId: 'c1',
        allowedEmployeeIds: null,
      }),
    );
  });

  it('pasa el alcance (allowedEmployeeIds) cuando el usuario no es ALL', async () => {
    const { service, repo } = makeService(['e1', 'e2']);
    await service.consolidatedReport(adminUser, { periodId: 'p1' });
    expect(repo.findHeaders).toHaveBeenCalledWith(
      expect.objectContaining({ allowedEmployeeIds: ['e1', 'e2'] }),
    );
  });

  it('devuelve totales en cero cuando no hay liquidaciones', async () => {
    const { service } = makeService(null);
    const res = await service.consolidatedReport(adminUser, { periodId: 'p1' });
    expect(res.rows).toHaveLength(0);
    expect(res.totals.employeeCount).toBe(0);
    expect(res.totals.totalIncentive).toBe(0);
  });

  it('consolida solo la versión vigente por empleado', async () => {
    const { service, repo } = makeService(null);
    const mk = (v: number, total: number) => ({
      employeeId: 'e1',
      periodId: 'p1',
      calculationVersion: v,
      component80Result: new Decimal(total),
      component20Result: new Decimal(0),
      totalIncentive: new Decimal(total),
      guaranteedPayApplied: false,
      employee: { person: { documentNumber: '1', firstName: 'A', lastName: 'B', fullName: 'A B' } },
      team: { teamName: 'T' },
      period: { periodYear: 2025, periodMonth: 5, periodType: 'MONTH' },
    });
    repo.findHeaders.mockResolvedValue([mk(1, 100), mk(2, 200)]);

    const res = await service.consolidatedReport(adminUser, { periodId: 'p1' });
    expect(res.rows).toHaveLength(1); // solo la v2
    expect(res.totals.totalIncentive).toBe(200);
  });
});
