import { ConflictException, NotFoundException } from '@nestjs/common';
import { ExecutionKpiService } from './execution-kpi.service';
import { AuditAction } from '../../shared/audit/audit.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ScopeType } from '../../common/constants/roles';

const USER: AuthenticatedUser = {
  userId: 'u1',
  username: 'admin',
  employeeId: null,
  roles: ['ADMIN'],
  scope: { type: ScopeType.ALL, subordinateEmployeeIds: [] },
};

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    period: { findUnique: jest.fn().mockResolvedValue({ periodId: 'p1', isClosed: false }) },
    salesTransaction: { findMany: jest.fn().mockResolvedValue([]) },
    employeeExecutionKpi: { findMany: jest.fn().mockResolvedValue([]), upsert: jest.fn() },
    // El listado también consulta el pago garantizado, para avisar en pantalla.
    employeePaymentCondition: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as never;
}

const audit = () => ({ record: jest.fn().mockResolvedValue(undefined) }) as never;

describe('ExecutionKpiService', () => {
  describe('list', () => {
    it('devuelve los empleados únicos de las ventas, con su marca', async () => {
      const prisma = makePrisma({
        salesTransaction: {
          findMany: jest.fn().mockResolvedValue([
            {
              employeeId: 'e1',
              employee: {
                employeeCode: 'A1',
                person: { documentNumber: '123', fullName: 'ANA', firstName: null, lastName: null },
                teamAssignments: [{ team: { teamName: 'Rep VM' } }],
              },
            },
            {
              employeeId: 'e2',
              employee: {
                employeeCode: 'A2',
                person: { documentNumber: '456', fullName: null, firstName: 'LUIS', lastName: 'PEREZ' },
                teamAssignments: [],
              },
            },
          ]),
        },
        employeeExecutionKpi: {
          findMany: jest.fn().mockResolvedValue([{ employeeId: 'e1', meetsKpi: true, notes: 'ok' }]),
          upsert: jest.fn(),
        },
      });
      const svc = new ExecutionKpiService(prisma, audit());

      const rows = await svc.list('p1');

      expect(rows).toHaveLength(2);
      const ana = rows.find((r) => r.employeeId === 'e1')!;
      expect(ana.meetsKpi).toBe(true);
      expect(ana.teamName).toBe('Rep VM');
      // Sin marca previa → false, no undefined.
      const luis = rows.find((r) => r.employeeId === 'e2')!;
      expect(luis.meetsKpi).toBe(false);
      expect(luis.fullName).toBe('LUIS PEREZ');
    });

    it('acota por lote cuando se pasa batchId', async () => {
      const prisma = makePrisma();
      const svc = new ExecutionKpiService(prisma, audit());
      await svc.list('p1', 'b1');
      expect((prisma as never as { salesTransaction: { findMany: jest.Mock } }).salesTransaction.findMany)
        .toHaveBeenCalledWith(expect.objectContaining({
          where: { periodId: 'p1', salesUploadBatchId: 'b1' },
        }));
    });

    it('expone el pago garantizado para que la pantalla lo señale', async () => {
      const prisma = makePrisma({
        salesTransaction: {
          findMany: jest.fn().mockResolvedValue([
            {
              employeeId: 'e1',
              employee: {
                employeeCode: 'A1',
                person: { documentNumber: '22478211', fullName: 'LILIANA OÑORO', firstName: null, lastName: null },
                teamAssignments: [],
              },
            },
            {
              employeeId: 'e2',
              employee: {
                employeeCode: 'A2',
                person: { documentNumber: '999', fullName: 'SIN GARANTIA', firstName: null, lastName: null },
                teamAssignments: [],
              },
            },
          ]),
        },
        employeePaymentCondition: {
          findMany: jest.fn().mockResolvedValue([
            {
              employeeId: 'e1',
              apply80Percent: true,
              apply20Percent: true,
              conditionType: 'MANUAL_ADJUSTMENT',
            },
          ]),
        },
      });
      const svc = new ExecutionKpiService(prisma, audit());

      const rows = await svc.list('p1');
      const conGarantia = rows.find((r) => r.employeeId === 'e1')!;
      expect(conGarantia.guaranteed).toEqual({
        apply80: true,
        apply20: true,
        conditionType: 'MANUAL_ADJUSTMENT',
      });
      // Quien no tiene condición viene en null, no en un objeto vacío.
      expect(rows.find((r) => r.employeeId === 'e2')!.guaranteed).toBeNull();
    });

    it('404 si el periodo no existe', async () => {
      const prisma = makePrisma({ period: { findUnique: jest.fn().mockResolvedValue(null) } });
      const svc = new ExecutionKpiService(prisma, audit());
      await expect(svc.list('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('save', () => {
    it('rechaza un periodo cerrado', async () => {
      const prisma = makePrisma({
        period: { findUnique: jest.fn().mockResolvedValue({ periodId: 'p1', isClosed: true }) },
      });
      const svc = new ExecutionKpiService(prisma, audit());
      await expect(
        svc.save({ periodId: 'p1', items: [{ employeeId: 'e1', meetsKpi: true }] }, USER),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hace upsert por (empleado, periodo) y registra auditoría', async () => {
      const prisma = makePrisma();
      const a = audit() as never as { record: jest.Mock };
      const svc = new ExecutionKpiService(prisma, a as never);

      const res = await svc.save(
        {
          periodId: 'p1',
          items: [
            { employeeId: 'e1', meetsKpi: true },
            { employeeId: 'e2', meetsKpi: false },
          ],
        },
        USER,
      );

      expect(res).toEqual({ periodId: 'p1', marked: 2, meeting: 1 });
      const upsert = (prisma as never as { employeeExecutionKpi: { upsert: jest.Mock } })
        .employeeExecutionKpi.upsert;
      expect(upsert).toHaveBeenCalledTimes(2);
      expect(upsert.mock.calls[0][0].where).toEqual({
        employeeId_periodId: { employeeId: 'e1', periodId: 'p1' },
      });
      expect(a.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.EXECUTION_KPI_SET,
          entityType: 'employee_execution_kpi',
          periodId: 'p1',
        }),
      );
    });
  });
});
