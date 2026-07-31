import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditAction, AuditService } from '../../shared/audit/audit.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { SaveExecutionKpiDto } from './dto/execution-kpi.dto';

/** Una fila de la pantalla de cumplimiento del 20%. */
export interface ExecutionKpiRow {
  employeeId: string;
  documentNumber: string;
  fullName: string;
  teamName: string | null;
  meetsKpi: boolean;
  notes: string | null;
  /**
   * Pago garantizado vigente en el periodo. Se expone para que la pantalla
   * avise: si cubre el 20%, esa persona lo cobra marque o no el KPI, y marcarla
   * a mano no cambia nada. Sin este aviso se marca a ciegas.
   */
  guaranteed: { apply80: boolean; apply20: boolean; conditionType: string } | null;
}

/**
 * Cumplimiento del KPI de ejecución (el 20%) por empleado y periodo.
 *
 * Los candidatos salen de las VENTAS del periodo: son "los empleados únicos que
 * vinieron en el archivo". Así la pantalla solo pide marcar a quien realmente
 * entra en la liquidación, y no a toda la nómina.
 */
@Injectable()
export class ExecutionKpiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(periodId: string, batchId?: string): Promise<ExecutionKpiRow[]> {
    const period = await this.prisma.period.findUnique({ where: { periodId } });
    if (!period) throw new NotFoundException('El periodo no existe');

    const sales = await this.prisma.salesTransaction.findMany({
      where: { periodId, ...(batchId ? { salesUploadBatchId: batchId } : {}) },
      distinct: ['employeeId'],
      select: {
        employeeId: true,
        employee: {
          select: {
            employeeCode: true,
            person: {
              select: {
                documentNumber: true,
                fullName: true,
                firstName: true,
                lastName: true,
              },
            },
            teamAssignments: {
              where: { active: true, isPrimary: true },
              orderBy: { validFrom: 'desc' },
              take: 1,
              select: { team: { select: { teamName: true } } },
            },
          },
        },
      },
    });

    const employeeIds = sales.map((s) => s.employeeId);

    const existing = await this.prisma.employeeExecutionKpi.findMany({
      where: { periodId, employeeId: { in: employeeIds } },
      select: { employeeId: true, meetsKpi: true, notes: true },
    });
    const byEmployee = new Map(existing.map((k) => [k.employeeId, k]));

    // Pago garantizado vigente: la pantalla lo señala para que quede claro por
    // qué alguien cobrará el 20% aunque no se le marque.
    const conditions = await this.prisma.employeePaymentCondition.findMany({
      where: { periodId, employeeId: { in: employeeIds } },
      orderBy: { createdAt: 'desc' },
      select: {
        employeeId: true,
        apply80Percent: true,
        apply20Percent: true,
        conditionType: true,
      },
    });
    // La más reciente por empleado gana, igual que hace el motor.
    const guaranteedBy = new Map<string, (typeof conditions)[number]>();
    for (const c of conditions) {
      if (!guaranteedBy.has(c.employeeId)) guaranteedBy.set(c.employeeId, c);
    }

    return sales
      .map((s) => {
        const p = s.employee.person;
        const mark = byEmployee.get(s.employeeId);
        const g = guaranteedBy.get(s.employeeId);
        return {
          employeeId: s.employeeId,
          documentNumber: String(p.documentNumber),
          fullName: p.fullName ?? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
          teamName: s.employee.teamAssignments[0]?.team.teamName ?? null,
          meetsKpi: mark?.meetsKpi ?? false,
          notes: mark?.notes ?? null,
          guaranteed: g
            ? {
                apply80: g.apply80Percent,
                apply20: g.apply20Percent,
                conditionType: g.conditionType,
              }
            : null,
        };
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async save(dto: SaveExecutionKpiDto, user: AuthenticatedUser) {
    const period = await this.prisma.period.findUnique({
      where: { periodId: dto.periodId },
    });
    if (!period) throw new NotFoundException('El periodo no existe');
    if (period.isClosed) {
      throw new ConflictException(
        'El periodo está cerrado; no admite cambios de cumplimiento',
      );
    }

    await this.prisma.$transaction(
      dto.items.map((i) =>
        this.prisma.employeeExecutionKpi.upsert({
          where: {
            employeeId_periodId: {
              employeeId: i.employeeId,
              periodId: dto.periodId,
            },
          },
          create: {
            employeeId: i.employeeId,
            periodId: dto.periodId,
            meetsKpi: i.meetsKpi,
            notes: i.notes ?? null,
            markedByUsername: user.username ?? null,
          },
          update: {
            meetsKpi: i.meetsKpi,
            notes: i.notes ?? null,
            markedByUsername: user.username ?? null,
          },
        }),
      ),
    );

    const meeting = dto.items.filter((i) => i.meetsKpi).length;

    // Queda en auditoría: decide si alguien cobra o no el 20%.
    await this.audit.record({
      userId: user.userId,
      username: user.username,
      action: AuditAction.EXECUTION_KPI_SET,
      entityType: 'employee_execution_kpi',
      periodId: dto.periodId,
      metadata: { marked: dto.items.length, meeting },
    });

    return { periodId: dto.periodId, marked: dto.items.length, meeting };
  }
}
