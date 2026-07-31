import { Injectable } from '@nestjs/common';
import { PeriodType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

/** Periodo con su ciclo padre resuelto. */
export interface PeriodWithParent {
  periodId: string;
  periodYear: number;
  periodMonth: number;
  periodType: PeriodType;
  cycleNumber: number | null;
  startDate: Date;
  endDate: Date;
  isClosed: boolean;
  parentPeriodId: string | null;
}

/**
 * Resuelve la relación mes ↔ ciclo.
 *
 * Los parámetros (pesos, curva, cuotas) se definen una vez en el ciclo y los
 * meses los heredan; un mes con filas propias las sobreescribe. Este servicio
 * dice DÓNDE buscar; `parameter-precedence.ts` dice CUÁL gana.
 *
 * Vive en `shared/` porque lo necesitan tres módulos —incentives, catalogs y
 * sales-import— y hacer que se importen entre sí solo para esto sería peor.
 */
@Injectable()
export class PeriodResolverService {
  constructor(private readonly prisma: PrismaService) {}

  findWithParent(periodId: string): Promise<PeriodWithParent | null> {
    return this.prisma.period.findUnique({
      where: { periodId },
      select: {
        periodId: true,
        periodYear: true,
        periodMonth: true,
        periodType: true,
        cycleNumber: true,
        startDate: true,
        endDate: true,
        isClosed: true,
        parentPeriodId: true,
      },
    });
  }

  /**
   * Ids donde buscar parámetros, EN ORDEN DE PRECEDENCIA: `[mes, ciclo]`.
   *
   * Un mes sin ciclo padre devuelve `[mes]` — el comportamiento anterior a este
   * modelo, que es lo que permite desplegar el cambio sin tocar los datos
   * existentes. Un ciclo se devuelve a sí mismo.
   */
  async resolveParameterPeriodIds(periodId: string): Promise<string[]> {
    const period = await this.prisma.period.findUnique({
      where: { periodId },
      select: { periodId: true, parentPeriodId: true },
    });
    if (!period) return [];
    return period.parentPeriodId
      ? [period.periodId, period.parentPeriodId]
      : [period.periodId];
  }

  /** Los meses de un ciclo, en orden. Vacío si el periodo no es un ciclo. */
  monthsOfCycle(cyclePeriodId: string) {
    return this.prisma.period.findMany({
      where: { parentPeriodId: cyclePeriodId, periodType: PeriodType.MONTH },
      orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
    });
  }

  /** ¿Algún mes del ciclo está cerrado? Bloquea editar los parámetros del ciclo. */
  async hasClosedMonths(cyclePeriodId: string): Promise<boolean> {
    const closed = await this.prisma.period.count({
      where: { parentPeriodId: cyclePeriodId, isClosed: true },
    });
    return closed > 0;
  }
}
