import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';
import { ReportRow } from '../reports.types';

const LOGO_PATH = path.resolve(process.cwd(), '../shared/Logo-zambon.png');

/**
 * Exportador PDF con pdfkit (sin navegador ni dependencias nativas). Genera un
 * documento tabular con la misma información que el XLSX. Mantiene la firma de
 * XlsxExporter para que ReportsService elija el formato sin ramificaciones.
 *
 * Para reportes individuales, incluye el desglose del 80% por componente.
 */
@Injectable()
export class PdfExporter {
  async generate(
    title: string,
    rows: ReportRow[],
    totals: { total80: number; total20: number; totalIncentive: number },
  ): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    this.render(doc, title, rows, totals);
    doc.end();

    return done;
  }

  private render(
    doc: PDFKit.PDFDocument,
    title: string,
    rows: ReportRow[],
    totals: { total80: number; total20: number; totalIncentive: number },
  ): void {
    // Logo
    const logoY = doc.y;
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, 36, logoY, { height: 32 });
    }

    // Encabezado — empujado debajo del logo si hay
    const titleY = fs.existsSync(LOGO_PATH) ? logoY + 40 : logoY;
    doc.y = titleY;
    doc.fontSize(16).fillColor('#111111').text(title, { align: 'left' });
    doc
      .fontSize(9)
      .fillColor('#666666')
      .text(`Generado: ${new Date().toLocaleString('es-CO')}`);
    doc.moveDown(0.8);

    // Detectar si es un reporte individual (con detalle de componentes)
    const hasDetails = rows.length === 1 && rows[0].componentDetails && rows[0].componentDetails.length > 0;

    if (hasDetails) {
      this.renderEmployeeDetail(doc, rows[0]);
    } else {
      this.renderConsolidatedTable(doc, rows, totals);
    }
  }

  /**
   * Renderiza el detalle individual del empleado con desglose del 80% por componente.
   */
  private renderEmployeeDetail(doc: PDFKit.PDFDocument, row: ReportRow): void {
    const money = (n: number) =>
      '$' + Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });
    const percent = (n: number) =>
      (Number(n || 0) * 100).toFixed(2) + '%';

    let y = doc.y;

    // Información del empleado
    doc.fontSize(12).fillColor('#111111').font('Helvetica-Bold')
      .text('Empleado', 36, y);
    y = doc.y + 4;

    doc.fontSize(10).font('Helvetica').fillColor('#333333')
      .text(`Cédula: ${row.documentNumber}`, 36, y);
    y = doc.y + 2;
    doc.text(`Nombre: ${row.fullName}`, 36, y);
    y = doc.y + 2;
    doc.text(`Equipo: ${row.team || '—'}`, 36, y);
    y = doc.y + 2;
    if (row.period) {
      doc.text(`Periodo: ${row.period}`, 36, y);
    }
    y = doc.y + 12;

    // Desglose del 80%
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#111111')
      .text('Componente 80% — Detalle por componente', 36, y);
    y = doc.y + 6;

    // Tabla de componentes
    const compCols = [
      { label: 'Componente', x: 36, w: 300, align: 'left' as const },
      { label: '% Cumpl.', x: 336, w: 100, align: 'right' as const },
      { label: 'Valor', x: 436, w: 120, align: 'right' as const },
    ];

    // Encabezado de tabla
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#555555');
    compCols.forEach((c) => {
      doc.text(c.label, c.x, y, { width: c.w, align: c.align });
    });
    y += 14;
    doc.moveTo(36, y).lineTo(556, y).strokeColor('#cccccc').stroke();
    y += 6;

    // Filas de componentes
    doc.font('Helvetica').fillColor('#111111');
    for (const comp of row.componentDetails!) {
      if (y > 500) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
        y = 36;
      }
      doc.fontSize(9);
      doc.text(comp.componentName, compCols[0].x, y, { width: compCols[0].w, align: compCols[0].align });
      doc.text(percent(comp.compliancePercent), compCols[1].x, y, { width: compCols[1].w, align: compCols[1].align });
      doc.text(money(comp.componentIncentiveValue), compCols[2].x, y, { width: compCols[2].w, align: compCols[2].align });
      y += 14;
    }

    // Total 80%
    y += 4;
    doc.moveTo(36, y).lineTo(556, y).strokeColor('#999999').stroke();
    y += 6;
    doc.font('Helvetica-Bold').fillColor('#303300');
    doc.text('Total Componente 80%', compCols[0].x, y, { width: compCols[0].w, align: compCols[0].align });
    doc.text(money(row.component80), compCols[2].x, y, { width: compCols[2].w, align: compCols[2].align });
    y += 20;

    // Resumen final
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#111111')
      .text('Resumen', 36, y);
    y += 16;

    const summaryCols = [
      { label: 'Concepto', x: 36, w: 300, align: 'left' as const },
      { label: 'Valor', x: 336, w: 220, align: 'right' as const },
    ];

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#555555');
    summaryCols.forEach((c) => {
      doc.text(c.label, c.x, y, { width: c.w, align: c.align });
    });
    y += 14;
    doc.moveTo(36, y).lineTo(556, y).strokeColor('#cccccc').stroke();
    y += 6;

    const summaryRows = [
      { label: 'Componente 80%', value: money(row.component80) },
      { label: 'Componente 20%', value: money(row.component20) },
      { label: 'Total Incentivo', value: money(row.totalIncentive), bold: true },
    ];

    for (const sr of summaryRows) {
      doc.fontSize(9).font(sr.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(sr.bold ? '#303300' : '#111111');
      doc.text(sr.label, summaryCols[0].x, y, { width: summaryCols[0].w, align: summaryCols[0].align });
      doc.text(sr.value, summaryCols[1].x, y, { width: summaryCols[1].w, align: summaryCols[1].align });
      y += 14;
    }
  }

  /**
   * Renderiza la tabla consolidada (varios empleados, sin detalle de componentes).
   */
  private renderConsolidatedTable(
    doc: PDFKit.PDFDocument,
    rows: ReportRow[],
    totals: { total80: number; total20: number; totalIncentive: number },
  ): void {
    // Definición de columnas (x fijo para alinear cabecera y filas)
    const cols = [
      { label: 'Cédula', x: 36, w: 80, align: 'left' as const },
      { label: 'Empleado', x: 116, w: 200, align: 'left' as const },
      { label: 'Equipo', x: 316, w: 150, align: 'left' as const },
      { label: '80%', x: 466, w: 90, align: 'right' as const },
      { label: '20%', x: 556, w: 90, align: 'right' as const },
      { label: 'Total', x: 646, w: 100, align: 'right' as const },
    ];

    const drawRow = (
      cells: string[],
      y: number,
      opts?: { bold?: boolean; color?: string },
    ) => {
      doc
        .fontSize(9)
        .font(opts?.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(opts?.color ?? '#111111');
      cols.forEach((c, i) => {
        doc.text(cells[i] ?? '', c.x, y, { width: c.w, align: c.align });
      });
    };

    let y = doc.y;
    drawRow(
      cols.map((c) => c.label),
      y,
      { bold: true },
    );
    y += 16;
    doc.moveTo(36, y).lineTo(746, y).strokeColor('#cccccc').stroke();
    y += 6;

    const money = (n: number) =>
      '$' + Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });

    for (const r of rows) {
      // Salto de página si se acaba el espacio vertical.
      if (y > 520) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
        y = 36;
      }
      drawRow(
        [
          r.documentNumber || '—',
          r.fullName || '—',
          r.team || '—',
          money(r.component80),
          money(r.component20),
          money(r.totalIncentive),
        ],
        y,
      );
      y += 15;
    }

    // Totales
    y += 4;
    doc.moveTo(36, y).lineTo(746, y).strokeColor('#999999').stroke();
    y += 6;
    drawRow(
      [
        '',
        `TOTAL (${rows.length} empleados)`,
        '',
        money(totals.total80),
        money(totals.total20),
        money(totals.totalIncentive),
      ],
      y,
      { bold: true, color: '#303300' },
    );
  }
}
