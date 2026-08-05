import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { ScopeService } from '../../common/scope/scope.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { toResultDetail, toResultListItem } from './results.mapper';
import { AccrualService } from './accrual.service';

@Injectable()
export class ResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
    private readonly accrual: AccrualService,
  ) {}

  /**
   * Lista liquidaciones aplicando el alcance del usuario en el `where` (nunca en
   * el frontend). Filtros opcionales por periodo/equipo/empleado.
   */
  async list(
    user: AuthenticatedUser,
    filters: { periodId?: string; teamId?: string; employeeId?: string },
  ) {
    const allowedIds = this.scope.allowedEmployeeIds(user);

    const rows = await this.prisma.incentiveCalculationHeader.findMany({
      where: {
        ...(allowedIds !== null ? { employeeId: { in: allowedIds } } : {}),
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.teamId ? { teamId: filters.teamId } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      },
      distinct: ['employeeId', 'periodId'],
      include: {
        employee: { include: { person: true } },
        team: true,
        period: true,
      },
      orderBy: { calculatedAt: 'desc' },
    });

    return rows.map(toResultListItem);
  }

  /** Detalle de una liquidación (cabecera + detalle por componente). */
  async detail(user: AuthenticatedUser, headerId: string) {
    const header = await this.prisma.incentiveCalculationHeader.findUnique({
      where: { incentiveCalculationHeaderId: headerId },
      include: {
        employee: {
          include: {
            person: true,
            teamAssignments: {
              where: { active: true, isPrimary: true },
              take: 1,
              include: { team: true },
            },
          },
        },
        period: true,
        details: { include: { component: true } },
      },
    });
    if (!header) throw new NotFoundException('La liquidación no existe');

    // Alcance: 403 si el empleado de la liquidación está fuera del árbol.
    this.scope.assertCanAccessEmployee(user, header.employeeId);

    return {
      ...toResultDetail(header),
      accrual: await this.accrual.forHeader(header),
    };
  }

  /** Última versión (o una específica) de un empleado en un periodo. */
  async byEmployeePeriod(
    user: AuthenticatedUser,
    employeeId: string,
    periodId: string,
    version?: number,
  ) {
    this.scope.assertCanAccessEmployee(user, employeeId);

    const header = await this.prisma.incentiveCalculationHeader.findFirst({
      where: {
        employeeId,
        periodId,
        ...(version ? { calculationVersion: version } : {}),
      },
      orderBy: { calculationVersion: 'desc' },
      include: {
        employee: {
          include: {
            person: true,
            teamAssignments: {
              where: { active: true, isPrimary: true },
              take: 1,
              include: { team: true },
            },
          },
        },
        period: true,
        details: { include: { component: true } },
      },
    });
    if (!header) throw new NotFoundException('Sin liquidación para ese empleado/periodo');

    return {
      ...toResultDetail(header),
      accrual: await this.accrual.forHeader(header),
    };
  }

  /** Historial de versiones de un empleado en el periodo de una liquidación. */
  async versions(user: AuthenticatedUser, headerId: string) {
    const header = await this.prisma.incentiveCalculationHeader.findUnique({
      where: { incentiveCalculationHeaderId: headerId },
      select: { employeeId: true, periodId: true },
    });
    if (!header) throw new NotFoundException('La liquidación no existe');
    this.scope.assertCanAccessEmployee(user, header.employeeId);

    return this.prisma.incentiveCalculationHeader.findMany({
      where: { employeeId: header.employeeId, periodId: header.periodId },
      orderBy: { calculationVersion: 'desc' },
      select: {
        incentiveCalculationHeaderId: true,
        calculationVersion: true,
        calculationStatus: true,
        totalIncentive: true,
        calculatedAt: true,
      },
    });
  }
}
