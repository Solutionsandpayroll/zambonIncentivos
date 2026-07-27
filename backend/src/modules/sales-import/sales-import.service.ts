import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { BatchStatus } from '@prisma/client';
import { SalesImportRepository } from './sales-import.repository';
import {
  parseSalesFile,
  ParsedSalesRow,
  RowError,
} from './domain/sales-file-parser';

export interface ImportResult {
  batchId: string;
  status: BatchStatus;
  counts: {
    total: number;
    valid: number;
    imported: number;
    duplicated: number;
    errors: number;
  };
  errors: RowError[];
}

@Injectable()
export class SalesImportService {
  private readonly logger = new Logger(SalesImportService.name);

  constructor(private readonly repo: SalesImportRepository) {}

  /**
   * Importa un archivo de ventas para un periodo (USECASES §3 backend).
   *  1. Valida periodo existente y abierto.
   *  2. Hash del archivo → detecta recarga duplicada (409).
   *  3. Parsea (estructura) y valida contra BD (documento/componente existen,
   *     periodo coincide).
   *  4. Persiste válidas (sales_transaction + upsert target); acumula errores.
   *  5. Marca el lote IMPORTED / ERROR y devuelve conteos.
   */
  async import(
    fileBuffer: Buffer,
    fileName: string,
    periodId: string,
    userId: string,
  ): Promise<ImportResult> {
    const period = await this.repo.findPeriodById(periodId);
    if (!period) throw new NotFoundException('El periodo no existe');
    if (period.isClosed) {
      throw new ConflictException('El periodo está cerrado; no admite cargas');
    }

    const content = fileBuffer.toString('utf-8');
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');

    const dup = await this.repo.findBatchByHash(periodId, fileHash);
    if (dup) {
      throw new ConflictException(
        'Este archivo ya fue cargado para el periodo (hash repetido)',
      );
    }

    let parsed;
    try {
      parsed = parseSalesFile(content);
    } catch (e) {
      // Error estructural (columnas faltantes, vacío) → 400, sin crear lote.
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Archivo inválido',
      );
    }

    const batch = await this.repo.createBatch({
      periodId,
      uploadedByUserId: userId,
      fileName,
      fileHash,
    });

    // Validación contra BD: existencia de documento y componente + periodo.
    const expectedPeriod = `${period.periodYear}-${String(period.periodMonth).padStart(2, '0')}`;
    const documents = [...new Set(parsed.valid.map((r) => r.documento))];
    const codes = [...new Set(parsed.valid.map((r) => r.componente))];
    const empByDoc = await this.repo.employeesByDocuments(documents);
    const compByCode = await this.repo.componentsByCodes(codes);

    const resolved: { employeeId: string; componentId: string; row: ParsedSalesRow }[] = [];
    const dbErrors: RowError[] = [...parsed.errors];

    for (const row of parsed.valid) {
      const reasons: string[] = [];
      if (row.periodo !== expectedPeriod) {
        reasons.push(`periodo ${row.periodo} no coincide con el lote (${expectedPeriod})`);
      }
      const employeeId = empByDoc.get(row.documento);
      if (!employeeId) reasons.push(`documento ${row.documento} sin empleado`);
      const componentId = compByCode.get(row.componente);
      if (!componentId) reasons.push(`componente ${row.componente} inexistente`);

      if (reasons.length > 0) {
        dbErrors.push({ rowNumber: row.rowNumber, reason: reasons.join('; ') });
        continue;
      }
      resolved.push({ employeeId: employeeId!, componentId: componentId!, row });
    }

    if (resolved.length > 0) {
      await this.repo.persistRows(batch.salesUploadBatchId, periodId, resolved);
    }

    const finalStatus =
      dbErrors.length > 0 && resolved.length === 0
        ? BatchStatus.ERROR
        : BatchStatus.IMPORTED;
    await this.repo.updateBatchStatus(batch.salesUploadBatchId, finalStatus);

    this.logger.log(
      `Lote ${batch.salesUploadBatchId}: ${resolved.length} importadas, ` +
        `${parsed.duplicated.length} duplicadas, ${dbErrors.length} errores`,
    );

    return {
      batchId: batch.salesUploadBatchId,
      status: finalStatus,
      counts: {
        total: parsed.valid.length + parsed.errors.length + parsed.duplicated.length,
        valid: parsed.valid.length,
        imported: resolved.length,
        duplicated: parsed.duplicated.length,
        errors: dbErrors.length,
      },
      errors: dbErrors,
    };
  }

  async listBatches(periodId?: string) {
    return this.repo.listBatches(periodId);
  }

  async getBatch(batchId: string) {
    const batch = await this.repo.getBatch(batchId);
    if (!batch) throw new NotFoundException('El lote no existe');
    return batch;
  }
}
