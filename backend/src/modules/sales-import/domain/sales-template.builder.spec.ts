import * as ExcelJS from 'exceljs';
import { buildSalesTemplate, TEMPLATE_SHEET_NAME } from './sales-template.builder';
import { readSalesSheet } from './xlsx-sheet-reader';
import { parseSalesGrid } from './sales-file-parser';

const INPUT = {
  periodLabel: '2026-01',
  teamName: 'Rep VM (E+X)',
  employees: [
    { documentNumber: '52965381', fullName: 'IVONNE CANTURA' },
    { documentNumber: '36285347', fullName: 'SANDRA MEDINA' },
  ],
  components: [
    { componentCode: 'FLUIMUCIL_VM', componentName: 'Fluimucil (Rep VM)' },
    { componentCode: 'MONURIL_VM', componentName: 'Monuril (Rep VM)' },
    { componentCode: 'FLUTOX', componentName: 'Flutox' },
  ],
};

async function reopen(buf: Buffer): Promise<ExcelJS.Worksheet> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  return wb.getWorksheet(TEMPLATE_SHEET_NAME)!;
}

describe('buildSalesTemplate', () => {
  it('genera una fila por empleado × componente', async () => {
    const sheet = await reopen(await buildSalesTemplate(INPUT));
    // 2 empleados × 3 componentes = 6 filas de datos (+1 de encabezado)
    const grid = await readSalesSheet(await buildSalesTemplate(INPUT));
    expect(grid.rows).toHaveLength(6);
    expect(sheet.name).toBe(TEMPLATE_SHEET_NAME);
  });

  it('replica el encabezado del archivo original, espacios incluidos', async () => {
    const sheet = await reopen(await buildSalesTemplate(INPUT));
    const header = [1, 2, 3, 4, 5, 6, 7].map((c) => sheet.getCell(1, c).value);
    expect(header).toEqual(['Numero', 'Documento', 'Empleado', 'Periodo ', 'Componente', 'Cuota ', 'Venta']);
  });

  it('mantiene el bloque combinado I1:J4 de referencia', async () => {
    const sheet = await reopen(await buildSalesTemplate(INPUT));
    expect(sheet.model.merges).toContain('I1:J4');
    expect(String(sheet.getCell('I1').value)).toContain('Componentes del Equipo');
  });

  it('lista los componentes del equipo desde I5', async () => {
    const sheet = await reopen(await buildSalesTemplate(INPUT));
    expect(sheet.getCell('I5').value).toBe('FLUIMUCIL_VM');
    expect(sheet.getCell('I6').value).toBe('MONURIL_VM');
    expect(sheet.getCell('I7').value).toBe('FLUTOX');
    expect(sheet.getCell('J5').value).toBe('Fluimucil (Rep VM)');
  });

  it('repite el periodo en todas las filas y deja Cuota/Venta vacías', async () => {
    const grid = await readSalesSheet(await buildSalesTemplate(INPUT));
    expect(grid.rows.every((r) => r[3] === '2026-01')).toBe(true);
    expect(grid.rows.every((r) => r[5] === '' && r[6] === '')).toBe(true);
  });

  it('escribe el nombre del empleado junto a su documento', async () => {
    const grid = await readSalesSheet(await buildSalesTemplate(INPUT));
    // Las 3 primeras filas son los 3 componentes de la primera persona.
    expect(grid.rows.slice(0, 3).every((r) => r[2] === 'IVONNE CANTURA')).toBe(true);
    expect(grid.rows.slice(3, 6).every((r) => r[2] === 'SANDRA MEDINA')).toBe(true);
    // El documento sigue en su columna: el nombre no lo desplaza.
    expect(grid.rows[0][1]).toBe('52965381');
  });

  it('precarga la cuota que ya tiene el sistema y deja vacías las que no', async () => {
    const quotas = new Map<string, number>([
      ['e1|c-flui', 1947.5],
      ['e1|c-monu', 726.96],
      // Flutox de e1 y todo e2 quedan sin cuota a propósito.
    ]);
    const withIds = {
      ...INPUT,
      employees: [
        { employeeId: 'e1', documentNumber: '52965381', fullName: 'IVONNE CANTURA' },
        { employeeId: 'e2', documentNumber: '36285347', fullName: 'SANDRA MEDINA' },
      ],
      components: [
        { componentId: 'c-flui', componentCode: 'FLUIMUCIL_VM', componentName: 'Fluimucil (Rep VM)' },
        { componentId: 'c-monu', componentCode: 'MONURIL_VM', componentName: 'Monuril (Rep VM)' },
        { componentId: 'c-flut', componentCode: 'FLUTOX', componentName: 'Flutox' },
      ],
      quotas,
    };

    const grid = await readSalesSheet(await buildSalesTemplate(withIds));
    // Orden de filas: e1×(flui, monu, flut), luego e2×(...)
    expect(grid.rows[0][5]).toBe('1947.5');
    expect(grid.rows[1][5]).toBe('726.96');
    expect(grid.rows[2][5]).toBe(''); // sin cuota → vacía, no 0
    expect(grid.rows[3][5]).toBe('');
    // La venta nunca se precarga: es el dato que viene a traer la plantilla.
    expect(grid.rows.every((r) => r[6] === '')).toBe(true);
  });

  it('sin ids no intenta cruzar cuotas (no rompe)', async () => {
    const grid = await readSalesSheet(
      await buildSalesTemplate({ ...INPUT, quotas: new Map([['x|y', 99]]) }),
    );
    expect(grid.rows.every((r) => r[5] === '')).toBe(true);
  });

  it('la plantilla vacía se relee y reporta las celdas sin llenar (no como 0)', async () => {
    const result = parseSalesGrid(await readSalesSheet(await buildSalesTemplate(INPUT)));
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(6);
    expect(result.errors[0].reason).toContain('cuota vacía');
  });

  it('round-trip: llenada a mano, se importa sin errores', async () => {
    const buf = await buildSalesTemplate(INPUT);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet(TEMPLATE_SHEET_NAME)!;
    for (let r = 2; r <= 7; r++) {
      sheet.getCell(r, 6).value = 100;
      sheet.getCell(r, 7).value = 110;
    }
    const filled = Buffer.from((await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer);

    const result = parseSalesGrid(await readSalesSheet(filled));
    expect(result.errors).toHaveLength(0);
    expect(result.duplicated).toHaveLength(0);
    expect(result.valid).toHaveLength(6);
    expect(result.valid[0].documento).toBe('52965381');
    expect(result.valid[0].cuota).toBe(100);
    expect(result.valid[0].ventaReal).toBe(110);
  });

  // La cuota vive en el ciclo y el importador la ignora: se muestra como
  // referencia, pero dejarla editable haría creer que se puede ajustar ahí.
  describe('la columna Cuota es de solo lectura', () => {
    it('protege la hoja para que el bloqueo surta efecto', async () => {
      const sheet = await reopen(await buildSalesTemplate(INPUT));
      // Sin hoja protegida, `locked` en las celdas no hace absolutamente nada.
      expect(sheet.protect).toBeDefined();
      expect((sheet as unknown as { sheetProtection?: unknown }).sheetProtection)
        .toBeTruthy();
    });

    it('bloquea Cuota y deja Venta editable', async () => {
      const sheet = await reopen(await buildSalesTemplate(INPUT));
      for (let r = 2; r <= 7; r++) {
        expect(sheet.getCell(r, 6).protection?.locked).not.toBe(false);
        expect(sheet.getCell(r, 7).protection?.locked).toBe(false);
      }
    });
  });
});
