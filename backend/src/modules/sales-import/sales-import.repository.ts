import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { BatchStatus } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { ParsedSalesRow } from './domain/sales-file-parser';

@Injectable()
export class SalesImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPeriodByYearMonth(year: number, month: number) {
    return this.prisma.period.findFirst({
      where: { periodYear: year, periodMonth: month },
    });
  }

  findPeriodById(periodId: string) {
    return this.prisma.period.findUnique({ where: { periodId } });
  }

  /** ¿Ya se subió este archivo (hash) para este periodo? */
  findBatchByHash(periodId: string, fileHash: string) {
    return this.prisma.salesUploadBatch.findFirst({
      where: { periodId, fileHash },
    });
  }

  /** Mapa documento→employeeId de los documentos presentes en el archivo. */
  async employeesByDocuments(
    documents: string[],
  ): Promise<Map<string, string>> {
    const persons = await this.prisma.person.findMany({
      where: { documentNumber: { in: documents } },
      select: { documentNumber: true, employee: { select: { employeeId: true } } },
    });
    const map = new Map<string, string>();
    for (const p of persons) {
      if (p.employee) map.set(p.documentNumber, p.employee.employeeId);
    }
    return map;
  }

  /** Mapa código→componentId de los componentes presentes en el archivo. */
  async componentsByCodes(codes: string[]): Promise<Map<string, string>> {
    const comps = await this.prisma.salesComponent.findMany({
      where: { componentCode: { in: codes } },
      select: { componentCode: true, componentId: true },
    });
    return new Map(comps.map((c) => [c.componentCode, c.componentId]));
  }

  createBatch(data: {
    periodId: string;
    uploadedByUserId: string;
    fileName: string;
    fileHash: string;
  }) {
    return this.prisma.salesUploadBatch.create({
      data: { ...data, status: BatchStatus.PROCESSING },
    });
  }

  updateBatchStatus(batchId: string, status: BatchStatus) {
    return this.prisma.salesUploadBatch.update({
      where: { salesUploadBatchId: batchId },
      data: { status },
    });
  }

  getBatch(batchId: string) {
    return this.prisma.salesUploadBatch.findUnique({
      where: { salesUploadBatchId: batchId },
    });
  }

  listBatches(periodId?: string) {
    return this.prisma.salesUploadBatch.findMany({
      where: periodId ? { periodId } : {},
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Persiste, en una transacción: las ventas resueltas (sales_transaction) y el
   * upsert de cuotas (team_component_target) por (empleado, componente, periodo).
   * `rows` ya viene resuelto a IDs por el servicio.
   */
  persistRows(
    batchId: string,
    periodId: string,
    rows: {
      employeeId: string;
      componentId: string;
      row: ParsedSalesRow;
    }[],
  ) {
    return this.prisma.$transaction(
      rows.flatMap(({ employeeId, componentId, row }) => [
        this.prisma.salesTransaction.create({
          data: {
            salesUploadBatchId: batchId,
            employeeId,
            componentId,
            periodId,
            saleValue: new Decimal(row.ventaReal),
          },
        }),
        this.prisma.teamComponentTarget.upsert({
          where: {
            employeeId_componentId_periodId: {
              employeeId,
              componentId,
              periodId,
            },
          },
          create: {
            employeeId,
            componentId,
            periodId,
            quotaValue: new Decimal(row.cuota),
          },
          update: { quotaValue: new Decimal(row.cuota) },
        }),
      ]),
    );
  }
}
