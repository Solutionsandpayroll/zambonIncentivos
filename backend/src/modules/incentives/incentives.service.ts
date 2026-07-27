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
import { cycleMultiplierForTeam } from './domain/execution-rules';
import { CalculateDto } from './dto/calculate.dto';

export interface CalculateSummary {
  periodId: string;
  version: number;
  processed: number;
  skipped: number;
  status: 'CALCULATED';
}

@Injectable()
export class IncentivesService {
  private readonly logger = new Logger(IncentivesService.name);

  constructor(
    private readonly repo: IncentivesRepository,
    private readonly config: ConfigService,
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

    // La curva es prerrequisito duro del cálculo.
    const curveRows = await this.repo.loadCurveSteps(dto.periodId);
    if (curveRows.length === 0) {
      throw new UnprocessableEntityException(
        'El periodo no tiene curva de pago definida',
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

    for (const employeeId of employeeIds) {
      const inputs = await this.repo.loadEmployeeInputs(
        employeeId,
        dto.periodId,
      );
      if (!inputs || inputs.components.length === 0) {
        skipped++;
        this.logger.warn(
          `Empleado ${employeeId} sin equipo/pesos/insumos; omitido`,
        );
        continue;
      }

      const cycleMultiplier = cycleMultiplierForTeam(inputs.teamCode);

      const result = calculateEmployeeIncentive({
        baseSalary: inputs.baseSalary,
        rate80,
        rate20,
        components: inputs.components,
        curve,
        executionKpiResult: inputs.executionKpiResult,
        cycleMultiplier,
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
        cycleMultiplier,
      );
      processed++;
    }

    return {
      periodId: dto.periodId,
      version: maxVersion,
      processed,
      skipped,
      status: 'CALCULATED',
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
