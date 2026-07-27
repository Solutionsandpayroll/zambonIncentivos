import { PdfExporter } from './pdf.exporter';
import { ReportRow } from '../reports.types';

describe('PdfExporter', () => {
  const exporter = new PdfExporter();

  const rows: ReportRow[] = [
    {
      employeeId: 'e1',
      documentNumber: '1047409019',
      fullName: 'JIMENEZ TORRES ROSMERY',
      team: 'Pharmacy Rep (Chains)',
      component80: 731280,
      component20: 731280,
      totalIncentive: 1462560,
      guaranteedPayApplied: false,
      calculationVersion: 1,
      status: 'CALCULATED',
    },
  ];

  it('genera un buffer PDF no vacío con la firma %PDF', async () => {
    const buffer = await exporter.generate('Consolidado por periodo', rows, {
      total80: 731280,
      total20: 731280,
      totalIncentive: 1462560,
    });
    expect(buffer.length).toBeGreaterThan(0);
    // Todo PDF empieza con "%PDF-".
    expect(buffer.slice(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('no falla con un conjunto vacío', async () => {
    const buffer = await exporter.generate('Vacío', [], {
      total80: 0,
      total20: 0,
      totalIncentive: 0,
    });
    expect(buffer.slice(0, 5).toString('ascii')).toBe('%PDF-');
  });
});
