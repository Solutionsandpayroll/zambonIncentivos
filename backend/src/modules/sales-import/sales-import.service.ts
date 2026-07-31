import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { BatchStatus } from '@prisma/client';
import { SalesImportRepository } from './sales-import.repository';
import {
  parseSalesFile,
  parseSalesGrid,
  ParsedSalesRow,
  RowError,
} from './domain/sales-file-parser';
import { readSalesSheet } from './domain/xlsx-sheet-reader';
import { buildSalesTemplate } from './domain/sales-template.builder';
import { PeriodResolverService } from '../../shared/periods/period-resolver.service';

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

  constructor(
    private readonly repo: SalesImportRepository,
    private readonly periods: PeriodResolverService,
  ) {}

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
    if (period.periodType === 'CYCLE') {
      throw new UnprocessableEntityException(
        'Las ventas se cargan por mes, no por ciclo',
      );
    }

    // Detección por bytes mágicos (un .xlsx es un ZIP: 'PK\x03\x04') en vez de
    // por extensión: un Excel renombrado a .csv daría basura y un error confuso.
    const isXlsx =
      fileBuffer.length >= 4 &&
      fileBuffer[0] === 0x50 &&
      fileBuffer[1] === 0x4b &&
      fileBuffer[2] === 0x03 &&
      fileBuffer[3] === 0x04;

    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');

    const dup = await this.repo.findBatchByHash(periodId, fileHash);
    if (dup) {
      throw new ConflictException(
        'Este archivo idéntico ya se cargó en el periodo. Si necesitas corregir ' +
          'datos, edita el archivo y vuelve a subirlo; si quieres reprocesar lo ' +
          'ya cargado, ve directamente al paso de cálculo.',
      );
    }

    let parsed;
    try {
      parsed = isXlsx
        ? parseSalesGrid(await readSalesSheet(fileBuffer))
        : parseSalesFile(fileBuffer.toString('utf-8'));
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
      sourceFormat: isXlsx ? 'XLSX' : 'CSV',
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

  /**
   * Arma la plantilla de ventas de un (periodo, equipo): una fila por cada
   * empleado del equipo × componente que ese equipo mide en el periodo.
   *
   * Se valida aquí y no al calcular porque es el punto útil para fallar: si el
   * equipo no tiene pesos o no tiene gente, el cálculo tampoco produciría nada,
   * y avisarlo al descargar ahorra el viaje completo.
   */
  async generateTemplate(
    periodId: string,
    teamId: string,
  ): Promise<{ fileName: string; buffer: Buffer }> {
    const period = await this.repo.findPeriodById(periodId);
    if (!period) throw new NotFoundException('El periodo no existe');
    if (period.isClosed) {
      throw new ConflictException('El periodo está cerrado; no admite cargas');
    }
    if (period.periodType === 'CYCLE') {
      throw new UnprocessableEntityException(
        'La plantilla de ventas es mensual: elige un mes, no un ciclo',
      );
    }

    const team = await this.repo.findTeamById(teamId);
    if (!team) throw new NotFoundException('El equipo no existe');

    // Pesos y cuotas se heredan del ciclo si el mes no los tiene propios.
    const parameterPeriodIds =
      await this.periods.resolveParameterPeriodIds(periodId);

    const components = await this.repo.teamComponentsForPeriod(
      teamId,
      parameterPeriodIds,
    );
    if (components.length === 0) {
      throw new UnprocessableEntityException(
        `El equipo "${team.teamName}" no tiene pesos de componentes definidos para el periodo. ` +
          'Defínelos en Componentes y pesos antes de cargar ventas.',
      );
    }

    const employees = await this.repo.teamEmployeesForPeriod(teamId, period);
    if (employees.length === 0) {
      throw new UnprocessableEntityException(
        `El equipo "${team.teamName}" no tiene empleados asignados en el periodo.`,
      );
    }

    // Cuotas del ciclo (o del mes si las sobreescribe): la plantilla las trae
    // escritas y bloqueadas — la cuota se define en Cuotas, no en el archivo.
    const quotas = await this.repo.quotasForEmployees(
      employees.map((e) => e.employeeId).filter((id): id is string => Boolean(id)),
      parameterPeriodIds,
    );

    const periodLabel = `${period.periodYear}-${String(period.periodMonth).padStart(2, '0')}`;
    const buffer = await buildSalesTemplate({
      periodLabel,
      teamName: team.teamName,
      employees,
      components,
      quotas,
    });

    const slug = (team.teamCode ?? team.teamName).replace(/[^A-Za-z0-9_-]+/g, '_');
    return { fileName: `plantilla_ventas_${slug}_${periodLabel}.xlsx`, buffer };
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
