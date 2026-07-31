import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ReportRow } from '../reports.types';

/** Genera un archivo Excel a partir de las filas consolidadas de un reporte. */
@Injectable()
export class XlsxExporter {
  async generate(
    title: string,
    rows: ReportRow[],
    totals: {
      total80: number;
      total20: number;
      totalIncentive: number;
      totalIdeal?: number;
      achievementPercent?: number | null;
    },
  ): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema de Incentivos Zambon';
    wb.created = new Date();

    const sheet = wb.addWorksheet('Reporte');

    // Encabezado del reporte
    sheet.mergeCells('A1', 'J1');
    sheet.getCell('A1').value = title;
    sheet.getCell('A1').font = { bold: true, size: 14 };

    // Columnas
    const headerRow = 3;
    sheet.getRow(headerRow).values = [
      'Cédula',
      'Empleado',
      'Equipo',
      'Periodo',
      '80%',
      '20%',
      'Total',
      'Ideal (100%)',
      'Logro',
      'Estado',
    ];
    sheet.getRow(headerRow).font = { bold: true };
    sheet.columns = [
      { key: 'documentNumber', width: 16 },
      { key: 'fullName', width: 34 },
      { key: 'team', width: 26 },
      { key: 'period', width: 12 },
      { key: 'component80', width: 16 },
      { key: 'component20', width: 16 },
      { key: 'totalIncentive', width: 16 },
      { key: 'idealTotal', width: 16 },
      { key: 'achievement', width: 10 },
      { key: 'status', width: 14 },
    ];

    for (const r of rows) {
      sheet.addRow({
        documentNumber: r.documentNumber,
        fullName: r.fullName,
        team: r.team ?? '',
        period: r.period ?? '',
        component80: r.component80,
        component20: r.component20,
        totalIncentive: r.totalIncentive,
        idealTotal: r.idealTotal,
        achievement: r.achievementPercent,
        status: r.guaranteedPayApplied ? 'Pago garantizado' : r.status,
      });
    }

    // Fila de totales
    const totalRow = sheet.addRow({
      fullName: `TOTAL (${rows.length} empleados)`,
      component80: totals.total80,
      component20: totals.total20,
      totalIncentive: totals.totalIncentive,
      idealTotal: totals.totalIdeal,
      achievement: totals.achievementPercent,
    });
    totalRow.font = { bold: true };

    // Formato de moneda para las columnas numéricas
    ['component80', 'component20', 'totalIncentive', 'idealTotal'].forEach((key) => {
      sheet.getColumn(key).numFmt = '#,##0.00';
    });
    sheet.getColumn('achievement').numFmt = '0%';

    const arrayBuffer = await wb.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
