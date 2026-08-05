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
