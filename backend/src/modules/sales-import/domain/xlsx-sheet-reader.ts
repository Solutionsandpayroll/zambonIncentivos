/**
 * ============================================================================
 *  Adaptador XLSX → rejilla. Traduce la plantilla de ventas (plantillaventas.xlsx)
 *  a la `SalesGrid` que valida `parseSalesGrid`. No valida reglas de negocio:
 *  solo lee celdas y las normaliza a texto.
 *
 *  Detalles de la plantilla real que este lector tiene en cuenta:
 *   - Los encabezados traen espacios finales ('Periodo ', 'Cuota '). El trim lo
 *     hace `parseSalesGrid`, pero aquí se respeta el texto tal cual se lee.
 *   - A la derecha hay un bloque de referencia con los componentes del equipo
 *     (celdas combinadas I1:J4 y la lista debajo). Por eso solo se leen las
 *     columnas A–F: leer la fila entera metería ese rótulo como si fuera una
 *     columna de datos.
 *   - El archivo declara más filas de las que tiene (`rowCount` 52 frente a 4
 *     reales), así que las filas vacías se descartan en vez de confiar en el
 *     conteo.
 * ============================================================================
 */
import * as ExcelJS from 'exceljs';
import { SalesGrid } from './sales-file-parser';

/** Nombre de hoja que genera el sistema; si no está, se usa la primera. */
const SHEET_NAME = 'plantillaventas';

/**
 * Columnas de datos de la plantilla: A..G
 * (Numero · Documento · Empleado · Periodo · Componente · Cuota · Venta).
 * El límite es deliberado: a la derecha, desde la columna I, vive el bloque de
 * referencia con los componentes del equipo, que no son datos.
 */
const FIRST_COL = 1;
const LAST_COL = 7;

/**
 * Convierte cualquier valor de celda de ExcelJS a texto plano.
 * ExcelJS devuelve number | string | Date | {richText} | {formula,result} |
 * {text,hyperlink} | null según cómo se haya escrito la celda.
 */
export function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';

  if (typeof value === 'number') {
    // Un documento largo escrito como número no debe salir en notación
    // exponencial ('5.2965381e+7' no cruzaría contra ninguna cédula).
    return Number.isInteger(value) ? value.toFixed(0) : String(value);
  }

  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return String(value);

  if (value instanceof Date) {
    // Excel puede reformatear '2025-05' como fecha. Se devuelve a YYYY-MM para
    // que el periodo siga cumpliendo el formato esperado.
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  if (typeof value === 'object') {
    const v = value as {
      richText?: Array<{ text: string }>;
      result?: unknown;
      text?: string;
      error?: string;
    };
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('');
    // Celda con fórmula: interesa el resultado cacheado, no la fórmula.
    if (v.result !== undefined && v.result !== null) {
      return cellToString(v.result as ExcelJS.CellValue);
    }
    if (typeof v.text === 'string') return v.text;
    if (v.error) return '';
  }

  return String(value);
}

/**
 * Lee el buffer de un .xlsx y devuelve la rejilla de datos (encabezado + filas).
 * Lanza si el archivo no tiene hojas o no tiene fila de encabezado.
 */
export async function readSalesSheet(buffer: Buffer): Promise<SalesGrid> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  const sheet = wb.getWorksheet(SHEET_NAME) ?? wb.worksheets[0];
  if (!sheet) {
    throw new Error('El archivo Excel no tiene hojas');
  }

  const readRow = (rowNumber: number): string[] => {
    const row = sheet.getRow(rowNumber);
    const cells: string[] = [];
    for (let c = FIRST_COL; c <= LAST_COL; c++) {
      cells.push(cellToString(row.getCell(c).value).trim());
    }
    return cells;
  };

  const header = readRow(1);
  if (header.every((h) => h === '')) {
    throw new Error('El archivo Excel no tiene fila de encabezado');
  }

  const rows: string[][] = [];
  // `actualRowCount` no siempre refleja las filas escritas; se recorre hasta
  // `rowCount` y se descartan las vacías.
  for (let r = 2; r <= sheet.rowCount; r++) {
    const cells = readRow(r);
    if (cells.every((c) => c === '')) continue;
    rows.push(cells);
  }

  return { header, rows };
}
