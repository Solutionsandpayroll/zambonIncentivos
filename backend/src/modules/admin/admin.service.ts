import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import { AuditAction, AuditService } from '../../shared/audit/audit.service';
import { IncentivesService } from '../incentives/incentives.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateNoveltyDto } from './dto/create-novelty.dto';
import { CreatePaymentConditionDto } from './dto/create-payment-condition.dto';
import { ReprocessDto } from './dto/reprocess.dto';
import { AuditQueryDto } from './dto/audit-query.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly repo: AdminRepository,
    private readonly audit: AuditService,
    private readonly incentives: IncentivesService,
  ) {}

  // ---- Novedades ----------------------------------------------------------
  listNovelties(filters: { periodId?: string; employeeId?: string }) {
    return this.repo.listNovelties(filters);
  }

  async createNovelty(dto: CreateNoveltyDto, user: AuthenticatedUser) {
    await this.assertEmployeeAndPeriod(dto.employeeId, dto.periodId);

    const novelty = await this.repo.createNovelty(dto);
    await this.audit.record({
      userId: user.userId,
      username: user.username,
      action: AuditAction.NOVELTY_CREATE,
      entityType: 'absence_or_novelty',
      entityId: novelty.noveltyId,
      periodId: dto.periodId,
      reason: dto.notes ?? null,
      metadata: { noveltyType: dto.noveltyType, employeeId: dto.employeeId },
    });
    return novelty;
  }

  // ---- Pago garantizado ---------------------------------------------------
  listPaymentConditions(filters: { periodId?: string; employeeId?: string }) {
    return this.repo.listPaymentConditions(filters);
  }

  async createPaymentCondition(
    dto: CreatePaymentConditionDto,
    user: AuthenticatedUser,
  ) {
    await this.assertEmployeeAndPeriod(dto.employeeId, dto.periodId);

    const condition = await this.repo.createPaymentCondition(dto);
    await this.audit.record({
      userId: user.userId,
      username: user.username,
      action: AuditAction.PAYMENT_CONDITION_CREATE,
      entityType: 'employee_payment_condition',
      entityId: condition.employeePaymentConditionId,
      periodId: dto.periodId,
      reason: dto.notes ?? null,
      metadata: {
        conditionType: dto.conditionType,
        apply80Percent: dto.apply80Percent ?? false,
        apply20Percent: dto.apply20Percent ?? false,
        employeeId: dto.employeeId,
      },
    });
    return condition;
  }

  // ---- Reproceso ----------------------------------------------------------
  /**
   * Relanza el cálculo de un periodo → nueva versión (no sobrescribe: USECASES §7).
   * Reusa el motor (IncentivesService); aquí solo se añade el registro de
   * auditoría con el motivo obligatorio.
   */
  async reprocess(dto: ReprocessDto, user: AuthenticatedUser) {
    const result = await this.incentives.calculate({
      periodId: dto.periodId,
      employeeIds: dto.employeeIds,
    });

    await this.audit.record({
      userId: user.userId,
      username: user.username,
      action: AuditAction.REPROCESS,
      entityType: 'incentive_calculation_header',
      periodId: dto.periodId,
      reason: dto.reason,
      metadata: {
        version: result.version,
        processed: result.processed,
        skipped: result.skipped,
        scope: dto.employeeIds ? 'SUBSET' : 'FULL_PERIOD',
      },
    });

    return result;
  }

  // ---- Auditoría ----------------------------------------------------------
  listAudit(query: AuditQueryDto) {
    return this.audit.list(query);
  }

  // ---- Helpers ------------------------------------------------------------
  private async assertEmployeeAndPeriod(
    employeeId: string,
    periodId: string,
  ): Promise<void> {
    const employee = await this.repo.employeeExists(employeeId);
    if (!employee) throw new NotFoundException('El empleado no existe');

    const period = await this.repo.period(periodId);
    if (!period) throw new NotFoundException('El periodo no existe');
    if (period.isClosed) {
      throw new ConflictException(
        'El periodo está cerrado; no admite cambios administrativos',
      );
    }
  }
}
