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

  it('marca la base del logro cuando la fila excluye el 20%', async () => {
    // El archivo va a Nómina: un 100% junto a un ideal que dobla el total
    // pagado necesita decir sobre qué se calculó, o se lee como un error.
    const ExcelJS = require('exceljs');
    const diferida: ReportRow[] = [
      { ...rows[0], achievementBase: 744576, achievementExcludes20: true },
    ];
    const buffer = await exporter.generate('Consolidado', diferida, {
      total80: 812340.5,
      total20: 0,
      totalIncentive: 812340.5,
      totalIdeal: 1489152,
      totalAchievementBase: 744576,
    });

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    const texto = JSON.stringify(wb.getWorksheet('Reporte').getSheetValues());
    expect(texto).toContain('Base del logro');
    expect(texto).toContain('744576 (solo 80%)');
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
