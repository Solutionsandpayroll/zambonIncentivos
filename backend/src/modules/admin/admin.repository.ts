import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateNoveltyDto } from './dto/create-novelty.dto';
import { CreatePaymentConditionDto } from './dto/create-payment-condition.dto';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  employeeExists(employeeId: string) {
    return this.prisma.employee.findUnique({
      where: { employeeId },
      select: { employeeId: true },
    });
  }

  period(periodId: string) {
    return this.prisma.period.findUnique({ where: { periodId } });
  }

  // ---- Novedades ----------------------------------------------------------
  listNovelties(filters: { periodId?: string; employeeId?: string }) {
    return this.prisma.absenceOrNovelty.findMany({
      where: {
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createNovelty(dto: CreateNoveltyDto) {
    return this.prisma.absenceOrNovelty.create({
      data: {
        employeeId: dto.employeeId,
        periodId: dto.periodId,
        noveltyType: dto.noveltyType,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        daysAffected: dto.daysAffected ?? null,
        impactType: dto.impactType ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  // ---- Condiciones de pago (pago garantizado) -----------------------------
  listPaymentConditions(filters: { periodId?: string; employeeId?: string }) {
    return this.prisma.employeePaymentCondition.findMany({
      where: {
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createPaymentCondition(dto: CreatePaymentConditionDto) {
    return this.prisma.employeePaymentCondition.create({
      data: {
        employeeId: dto.employeeId,
        periodId: dto.periodId,
        conditionType: dto.conditionType,
        apply80Percent: dto.apply80Percent ?? false,
        apply20Percent: dto.apply20Percent ?? false,
        notes: dto.notes ?? null,
      },
    });
  }
}
