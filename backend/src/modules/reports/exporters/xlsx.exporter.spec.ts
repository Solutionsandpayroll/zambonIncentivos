import { XlsxExporter } from './xlsx.exporter';
import { ReportRow } from '../reports.types';

describe('XlsxExporter', () => {
  const exporter = new XlsxExporter();

  const rows: ReportRow[] = [
    {
      employeeId: 'e1',
      documentNumber: '43455696',
      fullName: 'CATALINA SOTO',
      team: 'Pharmacy Rep (Chains)',
      period: '2026-01',
      component80: 812340.5,
      component20: 186144,
      totalIncentive: 998484.5,
      idealTotal: 1489152,
      achievementPercent: 0.67,
      achievementBase: 1489152,
      achievementExcludes20: false,
      guaranteedPayApplied: false,
      calculationVersion: 2,
      status: 'CALCULATED',
    },
  ];

  it('genera un buffer XLSX no vacío con la firma ZIP', async () => {
    const buffer = await exporter.generate('Consolidado', rows, {
      total80: 812340.5,
      total20: 186144,
      totalIncentive: 998484.5,
    });
    expect(buffer.length).toBeGreaterThan(0);
    // Todo .xlsx es un ZIP: empieza con "PK" (0x50 0x4B).
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('no falla con un conjunto de filas vacío', async () => {
    const buffer = await exporter.generate('Vacío', [], {
      total80: 0,
      total20: 0,
      totalIncentive: 0,
    });
    expect(buffer.length).toBeGreaterThan(0);
  });
});
