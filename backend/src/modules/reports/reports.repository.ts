import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

/** Relaciones que necesitan los mappers de reporte. */
const HEADER_INCLUDE = {
  employee: { include: { person: true } },
  team: true,
  period: true,
} as const;

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liquidaciones de un periodo, opcionalmente acotadas por equipo y por el
   * conjunto de empleados permitidos (alcance). Trae TODAS las versiones; la
   * capa de dominio se queda con la vigente.
   */
  /** Periodos de un conjunto de ids, para rotular el alcance de la exportación. */
  findPeriodsByIds(periodIds: string[]) {
    return this.prisma.period.findMany({
      where: { periodId: { in: periodIds } },
      select: { periodId: true, periodYear: true, periodMonth: true },
    });
  }

  findHeaders(filters: {
    periodId?: string;
    /** Varios periodos a la vez; tiene prioridad sobre `periodId`. */
    periodIds?: string[];
    teamId?: string;
    employeeId?: string;
    zoneId?: string;
    componentId?: string;
    allowedEmployeeIds: string[] | null;
  }) {
    return this.prisma.incentiveCalculationHeader.findMany({
      where: {
        ...(filters.periodIds && filters.periodIds.length > 0
          ? { periodId: { in: filters.periodIds } }
          : filters.periodId
            ? { periodId: filters.periodId }
            : {}),
        ...(filters.teamId ? { teamId: filters.teamId } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.allowedEmployeeIds !== null
          ? { employeeId: { in: filters.allowedEmployeeIds } }
          : {}),
        // Zona: filtra por la zona del empleado.
        ...(filters.zoneId ? { employee: { zoneId: filters.zoneId } } : {}),
        // Componente: solo liquidaciones con detalle de ese componente.
        ...(filters.componentId
          ? { details: { some: { componentId: filters.componentId } } }
          : {}),
      },
      include: HEADER_INCLUDE,
      orderBy: [{ employeeId: 'asc' }, { calculationVersion: 'desc' }],
    });
  }

  /** Detalle por componente de una liquidación (para el reporte individual). */
  findHeaderWithDetails(employeeId: string, periodId: string) {
    return this.prisma.incentiveCalculationHeader.findFirst({
      where: { employeeId, periodId },
      orderBy: { calculationVersion: 'desc' },
      include: {
        ...HEADER_INCLUDE,
        details: { include: { component: true } },
      },
    });
  }

  teamExists(teamId: string) {
    return this.prisma.team.findUnique({
      where: { teamId },
      select: { teamId: true, teamName: true },
    });
  }
}
