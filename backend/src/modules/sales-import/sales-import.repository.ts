import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { BatchStatus } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { ParsedSalesRow } from './domain/sales-file-parser';
import { preferMonthOverCycle } from '../../shared/periods/parameter-precedence';

@Injectable()
export class SalesImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPeriodByYearMonth(year: number, month: number) {
    // El filtro por tipo es obligatorio desde que existen los ciclos: un ciclo
    // comparte (año, mes) con su último mes —Ciclo1 lleva periodMonth 4— y sin
    // esto la búsqueda sería una moneda al aire que podría colgar las ventas
    // del periodo equivocado.
    return this.prisma.period.findFirst({
      where: { periodYear: year, periodMonth: month, periodType: 'MONTH' },
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

  findTeamById(teamId: string) {
    return this.prisma.team.findUnique({ where: { teamId } });
  }

  /**
   * Componentes que el equipo mide en el periodo (los que tienen peso), en
   * orden estable por código: así la plantilla sale idéntica en cada descarga.
   */
  async teamComponentsForPeriod(teamId: string, parameterPeriodIds: string[]) {
    const weights = await this.prisma.teamComponentWeight.findMany({
      where: { teamId, periodId: { in: parameterPeriodIds } },
      select: {
        periodId: true,
        component: {
          select: { componentId: true, componentCode: true, componentName: true },
        },
      },
    });

    // Sin la herencia del ciclo, la plantilla de un mes cuyos pesos viven en el
    // ciclo saldría sin columnas de componente.
    const [monthId] = parameterPeriodIds;
    const winning = preferMonthOverCycle(
      weights.filter((w) => w.periodId === monthId),
      weights.filter((w) => w.periodId !== monthId),
      () => teamId,
    );

    return winning
      .map((w) => w.component)
      .sort((a, b) => a.componentCode.localeCompare(b.componentCode));
  }

  /**
   * Cuotas ya cargadas del periodo, indexadas por `employeeId|componentId`,
   * para precargarlas en la plantilla.
   */
  async quotasForEmployees(
    employeeIds: string[],
    parameterPeriodIds: string[],
  ): Promise<Map<string, number>> {
    if (employeeIds.length === 0) return new Map();
    const rows = await this.prisma.teamComponentTarget.findMany({
      where: {
        periodId: { in: parameterPeriodIds },
        employeeId: { in: employeeIds },
      },
      select: {
        periodId: true,
        employeeId: true,
        componentId: true,
        quotaValue: true,
      },
    });

    // Precedencia por empleado: las cuotas se definen en el ciclo y un mes
    // puede traer las suyas.
    const [monthId] = parameterPeriodIds;
    const winning = preferMonthOverCycle(
      rows.filter((r) => r.periodId === monthId),
      rows.filter((r) => r.periodId !== monthId),
      (r) => r.employeeId,
    );

    return new Map(
      winning.map((r) => [`${r.employeeId}|${r.componentId}`, Number(r.quotaValue)]),
    );
  }

  /**
   * Empleados del equipo vigentes en el periodo. Usa el MISMO predicado de
   * solapamiento de fechas que el motor (incentives.repository), para que la
   * plantilla y el cálculo no discrepen sobre quién pertenece al equipo.
   */
  async teamEmployeesForPeriod(
    teamId: string,
    period: { startDate: Date; endDate: Date },
  ) {
    const employees = await this.prisma.employee.findMany({
      where: {
        active: true,
        teamAssignments: {
          some: {
            teamId,
            active: true,
            isPrimary: true,
            validFrom: { lte: period.endDate },
            OR: [{ validTo: null }, { validTo: { gte: period.startDate } }],
          },
        },
      },
      select: {
        employeeId: true,
        person: {
          select: { documentNumber: true, fullName: true, firstName: true, lastName: true },
        },
      },
      orderBy: { employeeCode: 'asc' },
    });

    return employees.map((e) => ({
      employeeId: e.employeeId,
      documentNumber: String(e.person.documentNumber).trim(),
      fullName:
        e.person.fullName ??
        `${e.person.firstName ?? ''} ${e.person.lastName ?? ''}`.trim(),
    }));
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
    /** 'XLSX' | 'CSV' — queda registrado en el lote para trazabilidad. */
    sourceFormat?: string;
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
   * Persiste las ventas resueltas (sales_transaction). `rows` ya viene resuelto
   * a IDs por el servicio.
   *
   * NO escribe cuotas. Antes hacía un upsert de `team_component_target` con la
   * columna Cuota del archivo, pero desde que las cuotas se definen por ciclo
   * eso crearía una excepción mensual silenciosa en cada carga: bastaría un
   * error de tecleo en el Excel para desviar la cuota de esa persona sin que
   * nadie lo decidiera. La cuota se administra en la pantalla de Cuotas; en la
   * plantilla viaja precargada y bloqueada, solo como referencia.
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
      rows.map(({ employeeId, componentId, row }) =>
        this.prisma.salesTransaction.create({
          data: {
            salesUploadBatchId: batchId,
            employeeId,
            componentId,
            periodId,
            saleValue: new Decimal(row.ventaReal),
          },
        }),
      ),
    );
  }
}
