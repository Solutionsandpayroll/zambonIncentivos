import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { ScopeService } from '../../common/scope/scope.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AppRole, ScopeType } from '../../common/constants/roles';

/**
 * Resumen operativo del tablero (`home`), adaptado al rol y alcance del usuario
 * (contrato §10). No inventa datos: cada tarjeta refleja el estado real de la BD;
 * si algo no aplica al rol, no se incluye.
 */
@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
  ) {}

  async summary(user: AuthenticatedUser) {
    const isStaff =
      user.roles.includes(AppRole.ADMIN) || user.roles.includes(AppRole.NOMINA);

    const activePeriod = await this.resolveActivePeriod();

    const base = {
      role: user.roles[0] ?? null,
      scope: user.scope.type,
      activePeriod: activePeriod
        ? {
            periodId: activePeriod.periodId,
            year: activePeriod.periodYear,
            month: activePeriod.periodMonth,
            type: activePeriod.periodType,
          }
        : null,
    };

    return isStaff
      ? { ...base, ...(await this.staffSummary(activePeriod?.periodId)) }
      : { ...base, ...(await this.employeeSummary(user, activePeriod?.periodId)) };
  }

  /**
   * Determina el periodo activo: el primer mes abierto que aún no tiene
   * liquidaciones. Si todos los meses abiertos ya están liquidados, devuelve
   * el más reciente. Así el tablero siempre señala "lo que toca hacer ahora"
   * en lugar de mostrar el último mes del año en ceros.
   */
  private async resolveActivePeriod() {
    const openMonths = await this.prisma.period.findMany({
      where: { isClosed: false, periodType: 'MONTH' },
      orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
      select: { periodId: true, periodYear: true, periodMonth: true, periodType: true },
    });

    if (!openMonths.length) return null;

    for (const month of openMonths) {
      const count = await this.prisma.incentiveCalculationHeader.count({
        where: { periodId: month.periodId },
      });
      if (count === 0) return month;
    }

    return openMonths[openMonths.length - 1];
  }

  /** Tarjetas para ADMIN / NÓMINA: estado global de periodos, cargas y cálculos. */
  private async staffSummary(activePeriodId?: string) {
    const [openPeriods, closedPeriods, pendingBatches, errorBatches, lastCalc] =
      await Promise.all([
        this.prisma.period.count({ where: { isClosed: false, periodType: 'MONTH' } }),
        this.prisma.period.count({ where: { isClosed: true } }),
        this.prisma.salesUploadBatch.count({
          where: { status: { in: ['PENDING', 'PROCESSING'] } },
        }),
        this.prisma.salesUploadBatch.count({ where: { status: 'ERROR' } }),
        this.prisma.incentiveCalculationHeader.findFirst({
          orderBy: { calculatedAt: 'desc' },
          select: { calculatedAt: true, periodId: true },
        }),
      ]);

    // Liquidaciones del periodo activo (conteo simple).
    const settlementsActivePeriod = activePeriodId
      ? await this.prisma.incentiveCalculationHeader.count({
          where: { periodId: activePeriodId },
        })
      : 0;

    return {
      staff: {
        openPeriods,
        closedPeriods,
        pendingBatches,
        errorBatches,
        settlementsActivePeriod,
        lastCalculationAt: lastCalc?.calculatedAt ?? null,
        teamProgress: await this.teamProgress(activePeriodId),
      },
    };
  }

  /**
   * Avance por equipo de un periodo elegido desde el tablero. Sin `periodId`
   * cae al periodo activo, que es lo que se muestra al entrar.
   */
  async teamProgressFor(periodId?: string) {
    if (periodId) return this.teamProgress(periodId);
    const active = await this.resolveActivePeriod();
    return this.teamProgress(active?.periodId);
  }

  /**
   * Avance de liquidación por equipo en un periodo: cuántos empleados del
   * equipo tienen liquidación frente al total de miembros activos. Sin periodo,
   * devuelve lista vacía.
   */
  private async teamProgress(periodId?: string) {
    if (!periodId) return [];

    const teams = await this.prisma.team.findMany({
      where: { active: true },
      select: { teamId: true, teamName: true },
    });

    const progress = await Promise.all(
      teams.map(async (team) => {
        // Total de miembros activos del equipo (asignación primaria vigente).
        const total = await this.prisma.employeeTeamAssignment.count({
          where: { teamId: team.teamId, active: true, isPrimary: true },
        });

        // Empleados con al menos una liquidación en el periodo (distinct).
        const calculatedRows =
          await this.prisma.incentiveCalculationHeader.findMany({
            where: { teamId: team.teamId, periodId },
            distinct: ['employeeId'],
            select: { employeeId: true },
          });

        return {
          teamId: team.teamId,
          teamName: team.teamName,
          calculated: calculatedRows.length,
          total,
        };
      }),
    );

    // Solo equipos con miembros; ordenados por nombre.
    return progress
      .filter((p) => p.total > 0)
      .sort((a, b) => a.teamName.localeCompare(b.teamName));
  }

  /** Tarjetas para EMPLEADO / COORDINADOR / GERENTE: su liquidación y alcance. */
  private async employeeSummary(
    user: AuthenticatedUser,
    activePeriodId?: string,
  ) {
    const allowedIds = this.scope.allowedEmployeeIds(user);

    // Última liquidación del propio empleado (o de su árbol si aplica).
    const lastSettlement = await this.prisma.incentiveCalculationHeader.findFirst(
      {
        where: {
          ...(allowedIds !== null ? { employeeId: { in: allowedIds } } : {}),
          ...(user.employeeId ? { employeeId: user.employeeId } : {}),
        },
        orderBy: { calculatedAt: 'desc' },
        select: {
          incentiveCalculationHeaderId: true,
          totalIncentive: true,
          calculationVersion: true,
          calculatedAt: true,
          period: { select: { periodYear: true, periodMonth: true } },
        },
      },
    );

    const teamSize =
      user.scope.type === ScopeType.HIERARCHY ||
      user.scope.type === ScopeType.TEAM
        ? user.scope.subordinateEmployeeIds.length
        : null;

    return {
      employee: {
        lastSettlement: lastSettlement
          ? {
              headerId: lastSettlement.incentiveCalculationHeaderId,
              total: lastSettlement.totalIncentive,
              version: lastSettlement.calculationVersion,
              period: lastSettlement.period
                ? `${lastSettlement.period.periodYear}-${String(
                    lastSettlement.period.periodMonth,
                  ).padStart(2, '0')}`
                : null,
              calculatedAt: lastSettlement.calculatedAt,
            }
          : null,
        teamSize,
      },
    };
  }
}
