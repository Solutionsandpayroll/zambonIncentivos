/**
 * ============================================================================
 *  Parser + validador del archivo de ventas — DOMINIO PURO (sin Nest/Prisma).
 *  Formato oficial "largo": una fila por (empleado, componente) (USECASES §3.1).
 *  Columnas obligatorias: documento, periodo, componente, cuota, venta_real.
 *  (nombre_empleado es opcional, solo validación cruzada.)
 *
 *  El parser NO conoce la BD: valida estructura y forma. La validación de
 *  existencia (documento en employee, componente en sales_component, periodo
 *  abierto) la hace el servicio contra Prisma.
 * ============================================================================
 */

export interface ParsedSalesRow {
  /** Número de fila en el archivo (1 = primera fila de datos, sin encabezado). */
  rowNumber: number;
  documento: string;
  periodo: string; // YYYY-MM
  componente: string; // código
  cuota: number;
  ventaReal: number;
}

export interface RowError {
  rowNumber: number;
  reason: string;
}

export interface ParseResult {
  valid: ParsedSalesRow[];
  errors: RowError[];
  /** Filas cuya combinación (documento, periodo, componente) se repite. */
  duplicated: RowError[];
}

const REQUIRED_COLUMNS = [
  'documento',
  'periodo',
  'componente',
  'cuota',
  'venta_real',
] as const;

const PERIOD_RE = /^\d{4}-\d{2}$/;

/** Divide una línea CSV simple (coma como separador, sin comillas anidadas). */
function splitCsvLine(line: string): string[] {
  return line.split(',').map((c) => c.trim());
}

/**
 * Parsea el contenido de un CSV "largo". Lanza si faltan columnas obligatorias
 * (error estructural que aborta todo el archivo). Los errores de fila NO abortan:
 * se acumulan y las filas válidas se conservan (USECASES §3 backend paso 6).
 */
export function parseSalesFile(content: string): ParseResult {
  const lines = content
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('El archivo está vacío');
  }

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    throw new Error(`Faltan columnas obligatorias: ${missing.join(', ')}`);
  }

  const idx = {
    documento: header.indexOf('documento'),
    periodo: header.indexOf('periodo'),
    componente: header.indexOf('componente'),
    cuota: header.indexOf('cuota'),
    ventaReal: header.indexOf('venta_real'),
  };

  const valid: ParsedSalesRow[] = [];
  const errors: RowError[] = [];
  const duplicated: RowError[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i; // 1 = primera fila de datos
    const cols = splitCsvLine(lines[i]);

    const documento = cols[idx.documento] ?? '';
    const periodo = cols[idx.periodo] ?? '';
    const componente = (cols[idx.componente] ?? '').toUpperCase();
    const cuotaRaw = cols[idx.cuota] ?? '';
    const ventaRaw = cols[idx.ventaReal] ?? '';

    const rowErrors: string[] = [];
    if (!documento) rowErrors.push('documento vacío');
    if (!PERIOD_RE.test(periodo))
      rowErrors.push('periodo inválido (se espera YYYY-MM)');
    if (!componente) rowErrors.push('componente vacío');

    const cuota = Number(cuotaRaw);
    const ventaReal = Number(ventaRaw);
    if (!Number.isFinite(cuota) || cuota < 0)
      rowErrors.push('cuota no numérica o negativa');
    if (!Number.isFinite(ventaReal) || ventaReal < 0)
      rowErrors.push('venta_real no numérica o negativa');

    if (rowErrors.length > 0) {
      errors.push({ rowNumber, reason: rowErrors.join('; ') });
      continue;
    }

    const key = `${documento}|${periodo}|${componente}`;
    if (seen.has(key)) {
      duplicated.push({
        rowNumber,
        reason: `combinación repetida (${documento}, ${periodo}, ${componente})`,
      });
      continue;
    }
    seen.add(key);

    valid.push({ rowNumber, documento, periodo, componente, cuota, ventaReal });
  }

  return { valid, errors, duplicated };
}
