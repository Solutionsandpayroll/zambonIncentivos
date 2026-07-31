import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../shared/database/prisma.service';
import { PeriodResolverService } from '../../shared/periods/period-resolver.service';
import { periodLabel } from '../catalogs/domain/period-calendar';

/** Lo devengado del 20% en el ciclo al que pertenece un mes. */
export interface AccrualInfo {
  cycleLabel: string;
  /** Meses del ciclo con KPI cumplido. */
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
    const monthsMet = await this.prisma.employeeExecutionKpi.count({
      where: {
        employeeId: header.employeeId,
        periodId: { in: monthIds },
        meetsKpi: true,
      },
    });

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
