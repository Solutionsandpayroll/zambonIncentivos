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
  ) {}

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
      teamId?: string;
      zoneId?: string;
      componentId?: string;
    },
  ): Promise<ConsolidatedReport> {
    return this.buildConsolidated(user, filters);
  }

  /** Exportación a archivo (XLSX funcional; PDF pendiente). */
  async export(user: AuthenticatedUser, dto: ExportReportDto): Promise<ExportResult> {
    const { periodId, teamId, employeeId } = dto.filters;

    let title: string;
    let report: ConsolidatedReport;

    switch (dto.type) {
      case ReportType.EMPLOYEE: {
        if (!employeeId) {
          throw new BadRequestException('El reporte EMPLOYEE requiere employeeId');
        }
        report = await this.buildConsolidated(user, { periodId, employeeId });
        title = 'Reporte individual de incentivos';
        break;
      }
      case ReportType.TEAM: {
        if (!teamId) {
          throw new BadRequestException('El reporte TEAM requiere teamId');
        }
        report = await this.teamReport(user, teamId, periodId);
        title = 'Consolidado por equipo';
        break;
      }
      case ReportType.CONSOLIDATED:
      default: {
        report = await this.consolidatedReport(user, { periodId, teamId });
        title = 'Consolidado por periodo';
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
   * Núcleo compartido: carga liquidaciones con alcance, conserva la versión
   * vigente por empleado (dominio puro) y arma filas + totales.
   */
  private async buildConsolidated(
    user: AuthenticatedUser,
    filters: {
      periodId: string;
      teamId?: string;
      employeeId?: string;
      zoneId?: string;
      componentId?: string;
    },
  ): Promise<ConsolidatedReport> {
    const allowedEmployeeIds = this.scope.allowedEmployeeIds(user);

    const headers = await this.repo.findHeaders({
      ...filters,
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
    return {
      rows,
      totals: {
        employeeCount: t.employeeCount,
        total80: t.total80.toNumber(),
        total20: t.total20.toNumber(),
        totalIncentive: t.totalIncentive.toNumber(),
        guaranteedCount: t.guaranteedCount,
      },
    };
  }
}
