import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ReportRow } from '../reports.types';

/** Genera un archivo Excel a partir de las filas consolidadas de un reporte. */
@Injectable()
export class XlsxExporter {
  async generate(
    title: string,
    rows: ReportRow[],
    totals: { total80: number; total20: number; totalIncentive: number },
  ): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema de Incentivos Zambon';
    wb.created = new Date();

    const sheet = wb.addWorksheet('Reporte');

    // Encabezado del reporte
    sheet.mergeCells('A1', 'G1');
    sheet.getCell('A1').value = title;
    sheet.getCell('A1').font = { bold: true, size: 14 };

    // Columnas
    const headerRow = 3;
    sheet.getRow(headerRow).values = [
      'Cédula',
      'Empleado',
      'Equipo',
      '80%',
      '20%',
      'Total',
      'Estado',
    ];
    sheet.getRow(headerRow).font = { bold: true };
    sheet.columns = [
      { key: 'documentNumber', width: 16 },
      { key: 'fullName', width: 34 },
      { key: 'team', width: 26 },
      { key: 'component80', width: 16 },
      { key: 'component20', width: 16 },
      { key: 'totalIncentive', width: 16 },
      { key: 'status', width: 14 },
    ];

    for (const r of rows) {
      sheet.addRow({
        documentNumber: r.documentNumber,
        fullName: r.fullName,
        team: r.team ?? '',
        component80: r.component80,
        component20: r.component20,
        totalIncentive: r.totalIncentive,
        status: r.guaranteedPayApplied ? 'Pago garantizado' : r.status,
      });
    }

    // Fila de totales
    const totalRow = sheet.addRow({
      fullName: `TOTAL (${rows.length} empleados)`,
      component80: totals.total80,
      component20: totals.total20,
      totalIncentive: totals.totalIncentive,
    });
    totalRow.font = { bold: true };

    // Formato de moneda para las columnas numéricas
    ['component80', 'component20', 'totalIncentive'].forEach((key) => {
      sheet.getColumn(key).numFmt = '#,##0.00';
    });

    const arrayBuffer = await wb.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
