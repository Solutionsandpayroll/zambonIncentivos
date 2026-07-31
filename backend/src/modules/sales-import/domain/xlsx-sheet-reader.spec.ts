import * as ExcelJS from 'exceljs';
import { readSalesSheet, cellToString } from './xlsx-sheet-reader';
import { parseSalesGrid } from './sales-file-parser';

/** Arma un .xlsx en memoria con la forma de la plantilla real. */
async function workbook(
  build: (sheet: ExcelJS.Worksheet) => void,
  sheetName = 'plantillaventas',
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet(sheetName);
  build(sheet);
  // ExcelJS declara su propio Buffer; se pasa por unknown para el de Node.
  return Buffer.from((await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer);
}

/** Encabezado tal cual aparece en plantillaventas.xlsx, espacios incluidos. */
const HEADER = [
  'Numero',
  'Documento',
  'Empleado',
  'Periodo ',
  'Componente',
  'Cuota ',
  'Venta',
];

describe('cellToString', () => {
  it('no devuelve documentos largos en notación exponencial', () => {
    expect(cellToString(1140815359)).toBe('1140815359');
    expect(cellToString(52965381)).toBe('52965381');
  });

  it('convierte una fecha a YYYY-MM (Excel reformatea el periodo)', () => {
    expect(cellToString(new Date(Date.UTC(2025, 4, 1)))).toBe('2025-05');
  });

  it('toma el resultado cacheado de una celda con fórmula', () => {
    expect(cellToString({ formula: 'A1*2', result: 1567 } as ExcelJS.CellValue)).toBe('1567');
  });

  it('aplana richText y trata null como vacío', () => {
    expect(cellToString({ richText: [{ text: 'FLUI' }, { text: 'MUCIL' }] } as ExcelJS.CellValue)).toBe(
      'FLUIMUCIL',
    );
    expect(cellToString(null)).toBe('');
  });
});

describe('readSalesSheet', () => {
  it('lee encabezado y filas de la plantilla', async () => {
    const buf = await workbook((s) => {
      s.getRow(1).values = HEADER;
      s.getRow(2).values = [1, '52965381', 'IVONNE CANTURA', '2025-05', 'FLUIMUCIL_VM', 1947.5, 2190];
      s.getRow(3).values = [2, '52965381', 'IVONNE CANTURA', '2025-05', 'MONURIL_VM', 726.96, 991];
    });

    const grid = await readSalesSheet(buf);
    expect(grid.header).toHaveLength(7);
    expect(grid.rows).toHaveLength(2);
    expect(grid.rows[0][1]).toBe('52965381');
    expect(grid.rows[1][4]).toBe('MONURIL_VM');
  });

  it('NO arrastra el bloque de referencia de la derecha (I/J) a la rejilla', async () => {
    const buf = await workbook((s) => {
      s.getRow(1).values = HEADER;
      s.mergeCells('I1:J4');
      s.getCell('I1').value = 'Componentes del Equipo';
      s.getCell('I5').value = 'FLUIMUCIL_VM';
      s.getCell('J5').value = 'Fluimucil (Rep VM)';
      s.getRow(2).values = [1, '123', 'ANA', '2025-05', 'FLUIMUCIL_VM', 10, 20];
    });

    const grid = await readSalesSheet(buf);
    // Solo columnas A..G: el rótulo del bloque no puede colarse.
    expect(grid.header).toHaveLength(7);
    expect(grid.header.join('|')).not.toContain('Componentes del Equipo');
    // La fila 5 solo tiene datos en I/J → no debe contar como fila de ventas.
    expect(grid.rows).toHaveLength(1);
  });

  it('descarta filas vacías intercaladas', async () => {
    const buf = await workbook((s) => {
      s.getRow(1).values = HEADER;
      s.getRow(2).values = [1, '123', 'ANA', '2025-05', 'MEDICINE', 10, 20];
      // fila 3 en blanco a propósito
      s.getRow(4).values = [2, '456', 'LUIS', '2025-05', 'MEDICINE', 30, 40];
    });

    const grid = await readSalesSheet(buf);
    expect(grid.rows).toHaveLength(2);
    expect(grid.rows[1][1]).toBe('456');
  });

  it('usa la primera hoja si el nombre no coincide', async () => {
    const buf = await workbook((s) => {
      s.getRow(1).values = HEADER;
      s.getRow(2).values = [1, '123', 'ANA', '2025-05', 'MEDICINE', 10, 20];
    }, 'Hoja renombrada');

    const grid = await readSalesSheet(buf);
    expect(grid.rows).toHaveLength(1);
  });

  it('la rejilla resultante pasa por parseSalesGrid sin errores', async () => {
    const buf = await workbook((s) => {
      s.getRow(1).values = HEADER;
      // Documento y periodo escritos como número y fecha, el caso incómodo.
      s.getRow(2).values = [1, 52965381, 'IVONNE', new Date(Date.UTC(2025, 4, 1)), 'FLUIMUCIL_VM', 1947.5, 2190];
    });

    const result = parseSalesGrid(await readSalesSheet(buf));
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].documento).toBe('52965381');
    expect(result.valid[0].periodo).toBe('2025-05');
    expect(result.valid[0].ventaReal).toBe(2190);
  });

  it('falla si no hay encabezado', async () => {
    const buf = await workbook(() => {
      /* hoja vacía */
    });
    await expect(readSalesSheet(buf)).rejects.toThrow(/encabezado/);
  });
});
