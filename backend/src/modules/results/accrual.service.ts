import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../shared/database/prisma.service';
import { PeriodResolverService } from '../../shared/periods/period-resolver.service';
import { periodLabel } from '../catalogs/domain/period-calendar';
import { monthAchievementFraction } from '../incentives/domain/execution-rules';

/** Lo devengado del 20% en el ciclo al que pertenece un mes. */
export interface AccrualInfo {
  cycleLabel: string;
  /** Meses del ciclo cumplidos. Admite medios (2.5) por los meses de dos KPIs. */
  monthsMet: number;
  /**
   * Meses del ciclo que ya terminaron. Se informa aparte de `monthsTotal`
   * porque "2 de 4 cumplidos" en febrero es engañoso: son 2 de 2 transcurridos.
   */
  monthsElapsed: number;
  monthsTotal: number;
  /** Lo que se cobraría al cierre con lo cumplido hasta hoy. */
  pendingAmount: number;
}

/**
 * Calcula el devengo del 20% de un empleado dentro de su ciclo.
 *
 * Solo se usa en el DETALLE de una liquidación: en el listado añadiría una
 * consulta por fila.
 */
@Injectable()
export class AccrualService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly periods: PeriodResolverService,
  ) {}

  async forHeader(header: {
    employeeId: string;
    periodId: string;
    component20Theoretical: Decimal | null;
    execution20Mode: string | null;
  }): Promise<AccrualInfo | null> {
    // Solo tiene sentido en un mes que devenga: quien cobra mensual no acumula
    // nada, y el header de un cierre de ciclo ya muestra el pago realizado.
    if (header.execution20Mode !== 'ACCRUE') return null;

    const period = await this.periods.findWithParent(header.periodId);
    if (!period?.parentPeriodId) return null;

    const cycle = await this.periods.findWithParent(period.parentPeriodId);
    if (!cycle) return null;

    const months = await this.periods.monthsOfCycle(cycle.periodId);
    if (months.length === 0) return null;

    const monthIds = months.map((m) => m.periodId);

    // Se suman FRACCIONES, no filas: un mes medido con dos KPIs y uno solo
    // cumplido aporta 0.5, así que `monthsMet` puede ser 2.5.
    const marks = await this.prisma.employeeExecutionKpi.findMany({
      where: { employeeId: header.employeeId, periodId: { in: monthIds } },
      select: { meetsKpi: true, meetsKpi2: true, kpiCount: true },
    });
    const monthsMet = marks.reduce(
      (sum, m) =>
        sum + monthAchievementFraction(m.kpiCount, m.meetsKpi, m.meetsKpi2),
      0,
    );

    // Transcurridos = los que ya terminaron. Se compara contra el fin del mes
    // que se está viendo, no contra hoy: al reimprimir en junio la liquidación
    // de febrero debe seguir diciendo "2 de 2", no "2 de 4".
    const monthsElapsed = months.filter(
      (m) => m.endDate <= period.endDate,
    ).length;

    const bag = header.component20Theoretical ?? new Decimal(0);

    return {
      cycleLabel: periodLabel({
        periodYear: cycle.periodYear,
        periodMonth: cycle.periodMonth,
        periodType: cycle.periodType,
        cycleNumber: cycle.cycleNumber,
      }),
      monthsMet,
      monthsElapsed,
      monthsTotal: months.length,
      pendingAmount: bag.mul(monthsMet).toDecimalPlaces(2).toNumber(),
    };
  }
}
