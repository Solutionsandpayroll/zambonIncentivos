import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { ScopeService } from '../../common/scope/scope.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { toEmployeeReport, toReportRow } from './reports.mapper';
import { consolidate, latestVersionOnly, CalculationRow } from './domain/aggregation';
import { ReportRow, ReportTotals } from './reports.types';
import { XlsxExporter } from './exporters/xlsx.exporter';
import { PdfExporter } from './exporters/pdf.exporter';
import { PeriodResolverService } from '../../shared/periods/period-resolver.service';
import { periodLabel as formatPeriodLabel } from '../catalogs/domain/period-calendar';
import {
  ExportFormat,
  ExportReportDto,
  ReportType,
} from './dto/export.dto';

export interface ConsolidatedReport {
  rows: ReportRow[];
  totals: ReportTotals;
}

export interface ExportResult {
  fileName: string;
  contentType: string;
  buffer: Buffer;
}

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Injectable()
export class ReportsService {
  constructor(
    private readonly repo: ReportsRepository,
    private readonly scope: ScopeService,
    private readonly xlsx: XlsxExporter,
    private readonly pdf: PdfExporter,
    private readonly periods: PeriodResolverService,
  ) {}

  /**
   * Traduce los periodos pedidos a los periodos donde REALMENTE viven las
   * liquidaciones: un ciclo se sustituye por sus meses, más el ciclo mismo.
   *
   * Sin esto, elegir "Ciclo 1" en Reportes devolvía vacío: las liquidaciones
   * mensuales se guardan contra el MES, así que filtrar por el id del ciclo no
   * casaba con ninguna. Se conserva también el id del ciclo porque el cierre
   * (el pago del 20% devengado) sí se guarda contra él, y omitirlo dejaría ese
   * pago fuera del consolidado del ciclo.
   */
  private async expandCycles(ids: string[]): Promise<string[]> {
    const expanded = new Set<string>();

    for (const id of ids) {
      expanded.add(id);
      const period = await this.periods.findWithParent(id);
      if (period?.periodType !== 'CYCLE') continue;
      for (const m of await this.periods.monthsOfCycle(id)) {
        expanded.add(m.periodId);
      }
    }

    return [...expanded];
  }

  /** Reporte individual: 80% por componente + 20% (última versión). */
  async employeeReport(
    user: AuthenticatedUser,
    employeeId: string,
    periodId: string,
  ) {
    this.scope.assertCanAccessEmployee(user, employeeId);
    const header = await this.repo.findHeaderWithDetails(employeeId, periodId);
    if (!header) {
      throw new NotFoundException('Sin liquidación para ese empleado/periodo');
    }
    return toEmployeeReport(header);
  }

  /** Consolidado por equipo. */
  async teamReport(
    user: AuthenticatedUser,
    teamId: string,
    periodId: string,
  ): Promise<ConsolidatedReport> {
    const team = await this.repo.teamExists(teamId);
    if (!team) throw new NotFoundException('El equipo no existe');
    return this.buildConsolidated(user, { periodId, teamId });
  }

  /** Consolidado por periodo/ciclo (para nómina). */
  async consolidatedReport(
    user: AuthenticatedUser,
    filters: {
      periodId: string;
      periodIds?: string[];
      teamId?: string;
      zoneId?: string;
      componentId?: string;
    },
  ): Promise<ConsolidatedReport> {
    return this.buildConsolidated(user, filters);
  }

  /** Exportación a archivo (XLSX funcional; PDF pendiente). */
  async export(user: AuthenticatedUser, dto: ExportReportDto): Promise<ExportResult> {
    const { periodId, periodIds, teamId, employeeId } = dto.filters;

    const multi = (periodIds ?? []).length > 0;
    if (!multi && !periodId) {
      throw new BadRequestException(
        'La exportación requiere periodId o periodIds',
      );
    }
    // Con varios periodos, `periodId` deja de mandar; se conserva el primero
    // solo para las rutas que aún piden un periodo único (TEAM).
    const singlePeriodId = periodId ?? periodIds![0];

    // Etiqueta legible del alcance temporal, para el título y el nombre del
    // archivo: exportar 3 meses y que el archivo se llame igual que uno de un
    // solo mes es la forma más fácil de confundir dos reportes distintos.
    const periodLabel = await this.periodLabel(
      multi ? periodIds! : [singlePeriodId],
    );

    let title: string;
    let report: ConsolidatedReport;

    switch (dto.type) {
      case ReportType.EMPLOYEE: {
        if (!employeeId) {
          throw new BadRequestException('El reporte EMPLOYEE requiere employeeId');
        }
        report = await this.buildConsolidated(user, {
          periodId: singlePeriodId,
          ...(multi ? { periodIds } : {}),
          employeeId,
        });
        title = `Reporte individual de incentivos · ${periodLabel}`;
        break;
      }
      case ReportType.TEAM: {
        if (!teamId) {
          throw new BadRequestException('El reporte TEAM requiere teamId');
        }
        report = multi
          ? await this.buildConsolidated(user, {
              periodId: singlePeriodId,
              periodIds,
              teamId,
            })
          : await this.teamReport(user, teamId, singlePeriodId);
        title = `Consolidado por equipo · ${periodLabel}`;
        break;
      }
      case ReportType.CONSOLIDATED:
      default: {
        report = await this.consolidatedReport(user, {
          periodId: singlePeriodId,
          ...(multi ? { periodIds } : {}),
          teamId,
        });
        title = `Consolidado por periodo · ${periodLabel}`;
        break;
      }
    }

    const totals = {
      total80: report.totals.total80,
      total20: report.totals.total20,
      totalIncentive: report.totals.totalIncentive,
    };

    if (dto.format === ExportFormat.PDF) {
      const buffer = await this.pdf.generate(title, report.rows, totals);
      return { fileName: `${title}.pdf`, contentType: 'application/pdf', buffer };
    }

    const buffer = await this.xlsx.generate(title, report.rows, totals);
    return { fileName: `${title}.xlsx`, contentType: XLSX_MIME, buffer };
  }

  /**
   * Etiqueta del alcance temporal: '2026-01' para uno solo, '2026-01 a 2026-03'
   * para un rango contiguo, y la lista separada por comas si hay saltos —
   * decir "a" sobre periodos no contiguos afirmaría que incluye meses que no
   * están en el archivo.
   */
  private async periodLabel(ids: string[]): Promise<string> {
    const periods = await this.repo.findPeriodsByIds(ids);
    if (periods.length === 0) return 'sin periodo';

    // Un ciclo se rotula por su nombre ('2026 · Ciclo 1 (ene–abr)'), no por su
    // periodMonth: ese guarda el ÚLTIMO mes del ciclo y se leería como abril.
    if (periods.length === 1 && periods[0].periodType === 'CYCLE') {
      return formatPeriodLabel(periods[0]);
    }

    const labels = periods
      .map((p) => ({
        key: p.periodYear * 12 + p.periodMonth,
        text: `${p.periodYear}-${String(p.periodMonth).padStart(2, '0')}`,
      }))
      .sort((a, b) => a.key - b.key);

    if (labels.length === 1) return labels[0].text;

    const contiguous = labels.every(
      (l, i) => i === 0 || l.key === labels[i - 1].key + 1,
    );
    return contiguous
      ? `${labels[0].text} a ${labels[labels.length - 1].text}`
      : labels.map((l) => l.text).join(', ');
  }

  /**
   * Núcleo compartido: carga liquidaciones con alcance, conserva la versión
   * vigente por empleado (dominio puro) y arma filas + totales.
   */
  private async buildConsolidated(
    user: AuthenticatedUser,
    filters: {
      periodId: string;
      periodIds?: string[];
      teamId?: string;
      employeeId?: string;
      zoneId?: string;
      componentId?: string;
    },
  ): Promise<ConsolidatedReport> {
    const allowedEmployeeIds = this.scope.allowedEmployeeIds(user);

    // Un ciclo no tiene liquidaciones propias salvo su cierre: hay que mirar
    // también sus meses. Se resuelve aquí, que es por donde pasan todas las
    // rutas de reporte (consolidado, por equipo e individual).
    const periodIds = await this.expandCycles(
      filters.periodIds && filters.periodIds.length > 0
        ? filters.periodIds
        : [filters.periodId],
    );

    const headers = await this.repo.findHeaders({
      ...filters,
      periodIds,
      allowedEmployeeIds,
    });

    // Solo la versión vigente por empleado/periodo cuenta en el consolidado.
    const calcRows: CalculationRow[] = headers.map((h) => ({
      employeeId: h.employeeId,
      periodId: h.periodId,
      calculationVersion: h.calculationVersion,
      component80Result: h.component80Result,
      component20Result: h.component20Result,
      totalIncentive: h.totalIncentive,
      guaranteedPayApplied: h.guaranteedPayApplied,
    }));

    const latestKeys = new Set(
      latestVersionOnly(calcRows).map(
        (r) => `${r.employeeId}|${r.periodId}|${r.calculationVersion}`,
      ),
    );

    const rows: ReportRow[] = headers
      .filter((h) =>
        latestKeys.has(`${h.employeeId}|${h.periodId}|${h.calculationVersion}`),
      )
      .map(toReportRow);

    const t = consolidate(calcRows);
    // El ideal se suma desde las filas ya mapeadas: cada una lo trae calculado
    // desde sus bolsas teóricas, así que no hace falta reagregarlo aparte.
    const totalIdeal = rows.reduce((a, r) => a + r.idealTotal, 0);
    const totalIncentive = t.totalIncentive.toNumber();

    return {
      rows,
      totals: {
        employeeCount: t.employeeCount,
        total80: t.total80.toNumber(),
        total20: t.total20.toNumber(),
        totalIncentive,
        totalIdeal: Math.round(totalIdeal * 100) / 100,
        achievementPercent: totalIdeal > 0 ? totalIncentive / totalIdeal : null,
        guaranteedCount: t.guaranteedCount,
      },
    };
  }
}
