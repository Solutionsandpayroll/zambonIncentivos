import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

/** Acciones auditables del gobierno administrativo. */
export enum AuditAction {
  NOVELTY_CREATE = 'NOVELTY_CREATE',
  PAYMENT_CONDITION_CREATE = 'PAYMENT_CONDITION_CREATE',
  REPROCESS = 'REPROCESS',
  PERIOD_CLOSE = 'PERIOD_CLOSE',
}

export interface AuditEntry {
  userId?: string | null;
  username?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  periodId?: string | null;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Servicio de auditoría administrativa (solo-append). Lo consumen novedades,
 * pago garantizado, reprocesos y cierres. Registrar auditoría NUNCA debe tumbar
 * la operación de negocio: si el log falla, se traga el error (best-effort).
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          userId: entry.userId ?? null,
          username: entry.username ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          periodId: entry.periodId ?? null,
          reason: entry.reason ?? null,
          metadata: entry.metadata,
        },
      });
    } catch {
      // No propagar: la bitácora no debe bloquear la acción administrativa.
    }
  }

  list(filters: { action?: string; periodId?: string }) {
    return this.prisma.adminAuditLog.findMany({
      where: {
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.periodId ? { periodId: filters.periodId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
