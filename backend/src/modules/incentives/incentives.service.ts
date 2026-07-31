import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Decimal } from '@prisma/client/runtime/library';
import { IncentivesRepository } from './incentives.repository';
import { PayCurve, CurveStep } from './domain/curve-pay';
import { calculateEmployeeIncentive } from './domain/calculation-engine';
import { execution20ModeFor } from './domain/execution-rules';
import { PeriodResolverService } from '../../shared/periods/period-resolver.service';
import { AuditAction, AuditService } from '../../shared/audit/audit.service';
import { CalculateDto } from './dto/calculate.dto';
import { CalculateCycleDto } from './dto/calculate-cycle.dto';
import { periodLabel } from '../catalogs/domain/period-calendar';

export interface CalculateSummary {
  periodId: string;
  version: number;
  processed: number;
  skipped: number;
  status: 'CALCULATED';
  /** Empleados que devengan el 20% en un mes sin ciclo: no hay dónde cobrarlo. */
  accruingWithoutCycle: number;
  /**
   * Si este mes es el ÚLTIMO de su ciclo, el ciclo que queda listo para
   * liquidar el 20% devengado. `null` en cualquier otro mes.
   *
   * Se devuelve aquí para que el asistente de Cálculo encadene la liquidación
   * sin tener que preguntar aparte "¿este mes cierra algo?".
   */
  closesCycle: { periodId: string; label: string } | null;
}

export interface CycleSummary {
  periodId: string;
  /** Meses que componen el ciclo. */
  months: number;
  version: number;
  processed: number;
  /** De los procesados, cuántos cobran algo (cumplieron al menos un mes). */
  paidEmployees: number;
  totalPaid: number;
  dryRun: boolean;
  status: 'CALCULATED' | 'PREVIEW';
}

/**
 * El cierre de ciclo no consulta la curva: sin componentes no hay cumplimiento
 * que traducir a porcentaje de pago, y el motor nunca la llama. `PayCurve`
 * rechaza una lista vacía, así que se pasa un escalón único que paga 0: deja
 * explícito que el 80% de este header es 0 por construcción, no por falta de
 * parametrización.
 */
const EMPTY_CURVE = new PayCurve([
  {
    minCompliance: new Decimal(0),
    payPercent: new Decimal(0),
    isCeiling: false,
  },
]);

@Injectable()
export class IncentivesService {
  private readonly logger = new Logger(IncentivesService.name);

  constructor(
    private readonly repo: IncentivesRepository,
    private readonly config: ConfigService,
    private readonly periods: PeriodResolverService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Ejecuta el cálculo del periodo (80% + 20% + excepciones) generando una
   * nueva versión por empleado. Síncrono por ahora; el diseño prevé mover a
   * cola (BullMQ) para volúmenes grandes (diseno §12).
   */
  async calculate(dto: CalculateDto): Promise<CalculateSummary> {
    const period = await this.repo.findPeriod(dto.periodId);
    if (!period) {
      throw new NotFoundException('El periodo no existe');
    }
    if (period.isClosed) {
      throw new ConflictException('El periodo está cerrado; no se recalcula');
    }
    if (period.periodType === 'CYCLE') {
      // El cálculo mensual liquida el 80% contra las ventas del mes; un ciclo
      // no tiene ventas propias. Su liquidación es otra operación.
      throw new UnprocessableEntityException(
        'Este periodo es un ciclo: use la liquidación de ciclo, no el cálculo mensual',
      );
    }

    // Dónde buscar los parámetros: `[mes, ciclo]` por precedencia. Se resuelve
    // UNA vez por cálculo, no por empleado — el bucle ya hace varias consultas
    // por persona y esto es constante para todas.
    const parameterPeriodIds = await this.periods.resolveParameterPeriodIds(
      dto.periodId,
    );

    // La curva es prerrequisito duro del cálculo.
    const curveRows = await this.repo.loadCurveSteps(parameterPeriodIds);
    if (curveRows.length === 0) {
      throw new UnprocessableEntityException(
        'El periodo no tiene curva de pago definida, ni propia ni heredada del ciclo',
      );
    }
    const curve = this.buildCurve(curveRows);

    const rate80 = new Decimal(this.config.get<number>('incentives.rate80')!);
    const rate20 = new Decimal(this.config.get<number>('incentives.rate20')!);

    const employeeIds =
      dto.employeeIds && dto.employeeIds.length > 0
        ? dto.employeeIds
        : await this.repo.employeesWithSalesInPeriod(dto.periodId);

    if (employeeIds.length === 0) {
      throw new UnprocessableEntityException(
        'No hay ventas cargadas para el periodo',
      );
    }

    let processed = 0;
    let skipped = 0;
    let maxVersion = 0;
    // Un mes sin ciclo devenga el 20% sin fecha de cobro. No se bloquea —el
    // sistema quedaría inutilizable el día que alguien olvide sembrar el año—
    // pero se avisa en la respuesta para que la pantalla lo muestre.
    const hasCycle = parameterPeriodIds.length > 1;
    let accruingWithoutCycle = 0;

    for (const employeeId of employeeIds) {
      const inputs = await this.repo.loadEmployeeInputs(
        employeeId,
        dto.periodId,
        parameterPeriodIds,
      );
      if (!inputs || inputs.components.length === 0) {
        skipped++;
        this.logger.warn(
          `Empleado ${employeeId} sin equipo/pesos/insumos; omitido`,
        );
        continue;
      }

      // Quien cobra mensual sigue cobrando mes a mes; el resto solo devenga.
      const execution20Mode = execution20ModeFor(inputs.pays20Monthly, 'MONTH');
      if (execution20Mode === 'ACCRUE' && !hasCycle) accruingWithoutCycle++;

      const result = calculateEmployeeIncentive({
        baseSalary: inputs.baseSalary,
        rate80,
        rate20,
        components: inputs.components,
        curve,
        executionKpiResult: inputs.executionKpiResult,
        monthAchievement: inputs.monthAchievement,
        execution20Mode,
        guaranteedPay: inputs.guaranteedPay,
      });

      const nextVersion =
        (await this.repo.lastVersion(employeeId, dto.periodId)) + 1;
      maxVersion = Math.max(maxVersion, nextVersion);

      await this.repo.saveCalculation(
        employeeId,
        dto.periodId,
        inputs.teamId,
        nextVersion,
        result,
        inputs.pays20Monthly,
      );
      processed++;
    }

    if (accruingWithoutCycle > 0) {
      this.logger.warn(
        `${accruingWithoutCycle} empleados devengan el 20% en un mes sin ciclo ` +
          'asociado: no hay cierre donde cobrarlo. Siembra el año del periodo.',
      );
    }

    return {
      periodId: dto.periodId,
      version: maxVersion,
      processed,
      skipped,
      status: 'CALCULATED',
      accruingWithoutCycle,
      closesCycle: await this.cycleClosedBy(dto.periodId),
    };
  }

  /**
   * El ciclo que este mes CIERRA, o `null` si no cierra ninguno.
   *
   * Un mes cierra su ciclo cuando es el último de los cuatro. Es la señal que
   * usa el asistente de Cálculo para ofrecer la liquidación del 20% justo
   * después de calcular ese mes, en vez de dejarla escondida en otra pantalla
   * donde se olvidaba y el devengo se quedaba sin cobrar.
   */
  private async cycleClosedBy(
    monthPeriodId: string,
  ): Promise<{ periodId: string; label: string } | null> {
    const month = await this.periods.findWithParent(monthPeriodId);
    if (!month?.parentPeriodId) return null;

    const cycle = await this.periods.findWithParent(month.parentPeriodId);
    if (!cycle) return null;

    // Ya liquidado o sellado: no hay nada que ofrecer.
    if (cycle.isClosed) return null;

    const months = await this.periods.monthsOfCycle(cycle.periodId);
    const last = months[months.length - 1];
    if (!last || last.periodId !== monthPeriodId) return null;

    return {
      periodId: cycle.periodId,
      label: periodLabel({
        periodYear: cycle.periodYear,
        periodMonth: cycle.periodMonth,
        periodType: cycle.periodType,
        cycleNumber: cycle.cycleNumber,
      }),
    };
  }

  /**
   * Liquida el 20% devengado de un ciclo: una bolsa mensual por cada mes con
   * KPI cumplido.
   *
   * Es una operación aparte de `closePeriod` a propósito: cerrar es un flag
   * idempotente, esto es una escritura larga y falible que además hay que poder
   * previsualizar.
   */
  async calculateCycle(dto: CalculateCycleDto): Promise<CycleSummary> {
    const period = await this.repo.findPeriod(dto.periodId);
    if (!period) {
      throw new NotFoundException('El periodo no existe');
    }
    if (period.periodType !== 'CYCLE') {
      throw new UnprocessableEntityException(
        'Este periodo es un mes: use el cálculo mensual, no la liquidación de ciclo',
      );
    }
    if (period.isClosed) {
      throw new ConflictException('El ciclo está cerrado; no se reliquida');
    }

    const months = await this.periods.monthsOfCycle(dto.periodId);
    if (months.length === 0) {
      throw new UnprocessableEntityException(
        'El ciclo no tiene meses asociados: no hay nada devengado que liquidar',
      );
    }
    const monthIds = months.map((m) => m.periodId);

    const rate80 = new Decimal(this.config.get<number>('incentives.rate80')!);
    const rate20 = new Decimal(this.config.get<number>('incentives.rate20')!);

    // Los equipos que cobran mensual ya quedaron excluidos en la consulta: su
    // 20% se pagó mes a mes y volver a pagarlo aquí sería duplicarlo.
    const candidates = await this.repo.cycleCandidates(monthIds);
    if (candidates.length === 0) {
      throw new UnprocessableEntityException(
        'Ningún empleado del ciclo tiene liquidaciones mensuales que consolidar',
      );
    }

    const metByEmployee = await this.repo.metMonthsByEmployee(monthIds);
    const guaranteed = await this.repo.guaranteed20InCycle(monthIds);

    let processed = 0;
    let paidEmployees = 0;
    let totalPaid = new Decimal(0);
    let maxVersion = 0;

    for (const c of candidates) {
      const metMonths = metByEmployee.get(c.employeeId) ?? 0;
      const apply20 = guaranteed.has(c.employeeId);

      const result = calculateEmployeeIncentive({
        baseSalary: c.baseSalary,
        rate80,
        rate20,
        // El ciclo no tiene ventas propias: sin componentes el 80% queda en 0.
        components: [],
        curve: EMPTY_CURVE,
        executionKpiResult: metMonths > 0,
        execution20Mode: 'PAY_CYCLE',
        metMonthsInCycle: metMonths,
        cycleLengthMonths: months.length,
        // apply80 SIEMPRE en falso: la bolsa teórica del 80% se calcula igual
        // aunque no haya componentes, y una garantía heredada del mes pagaría
        // aquí una bolsa del 80% extra que ya se pagó en su mes.
        guaranteedPay: apply20 ? { apply80: false, apply20: true } : null,
      });

      totalPaid = totalPaid.add(result.component20Result);
      if (result.component20Result.greaterThan(0)) paidEmployees++;

      if (!dto.dryRun) {
        const nextVersion =
          (await this.repo.lastVersion(c.employeeId, dto.periodId)) + 1;
        maxVersion = Math.max(maxVersion, nextVersion);
        await this.repo.saveCalculation(
          c.employeeId,
          dto.periodId,
          c.teamId,
          nextVersion,
          result,
          false,
        );
      }
      processed++;
    }

    if (!dto.dryRun) {
      await this.audit.record({
        action: AuditAction.CYCLE_PAYOUT,
        entityType: 'Period',
        entityId: dto.periodId,
        periodId: dto.periodId,
        metadata: {
          months: monthIds.length,
          processed,
          paidEmployees,
          totalPaid: totalPaid.toNumber(),
        },
      });
    }

    return {
      periodId: dto.periodId,
      months: monthIds.length,
      version: maxVersion,
      processed,
      paidEmployees,
      totalPaid: totalPaid.toNumber(),
      dryRun: Boolean(dto.dryRun),
      status: dto.dryRun ? 'PREVIEW' : 'CALCULATED',
    };
  }

  private buildCurve(
    rows: {
      minCompliancePercent: Decimal;
      payPercent: Decimal;
      isCeiling: boolean;
    }[],
  ): PayCurve {
    const steps: CurveStep[] = rows.map((r) => ({
      minCompliance: r.minCompliancePercent,
      payPercent: r.payPercent,
      isCeiling: r.isCeiling,
    }));
    return new PayCurve(steps);
  }
}
