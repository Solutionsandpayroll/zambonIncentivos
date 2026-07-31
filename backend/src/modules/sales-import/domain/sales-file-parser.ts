/**
 * ============================================================================
 *  Parser + validador del archivo de ventas — DOMINIO PURO (sin Nest/Prisma).
 *  Formato oficial "largo": una fila por (empleado, componente) (USECASES §3.1).
 *  Columnas obligatorias: documento, periodo, componente, cuota y la venta
 *  (`venta` en la plantilla XLSX, `venta_real` en el CSV histórico).
 *  Las demás columnas del archivo (`Numero`, `nombre_empleado`) se ignoran.
 *
 *  La validación vive en `parseSalesGrid`, que trabaja sobre una rejilla ya
 *  tokenizada; cada formato aporta su propio adaptador (`parseSalesFile` para
 *  CSV, `readSalesSheet` para XLSX). Así la regla de negocio es una sola.
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

/**
 * Nombres aceptados por columna lógica. Se admite más de uno porque conviven
 * dos formatos: la plantilla XLSX rotula la venta como `Venta`, y el CSV
 * histórico como `venta_real`. Cualquier otra columna del archivo (`Numero`,
 * `nombre_empleado`) simplemente no se busca y se ignora.
 */
const COLUMN_ALIASES = {
  documento: ['documento'],
  periodo: ['periodo'],
  componente: ['componente'],
  cuota: ['cuota'],
  ventaReal: ['venta', 'venta_real'],
} as const;

type ColumnKey = keyof typeof COLUMN_ALIASES;

const PERIOD_RE = /^\d{4}-\d{2}$/;

/** Rejilla ya tokenizada: encabezado + filas. La produce el adaptador de cada formato. */
export interface SalesGrid {
  header: string[];
  rows: string[][];
}

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

  return parseSalesGrid({
    header: splitCsvLine(lines[0]),
    rows: lines.slice(1).map(splitCsvLine),
  });
}

/**
 * Valida una rejilla ya tokenizada, venga de CSV o de XLSX. Aquí vive toda la
 * lógica de negocio del archivo; los adaptadores de formato solo producen la
 * rejilla.
 */
export function parseSalesGrid(grid: SalesGrid): ParseResult {
  // Se normaliza el encabezado: la plantilla real trae espacios finales
  // ('Periodo ', 'Cuota ') que de otro modo harían fallar la búsqueda.
  const header = grid.header.map((h) => String(h ?? '').trim().toLowerCase());

  const idx = {} as Record<ColumnKey, number>;
  const missing: string[] = [];
  for (const key of Object.keys(COLUMN_ALIASES) as ColumnKey[]) {
    const aliases: readonly string[] = COLUMN_ALIASES[key];
    const found = aliases.map((a) => header.indexOf(a)).find((i) => i >= 0);
    if (found === undefined) missing.push(aliases[0]);
    else idx[key] = found;
  }
  if (missing.length > 0) {
    throw new Error(`Faltan columnas obligatorias: ${missing.join(', ')}`);
  }

  const valid: ParsedSalesRow[] = [];
  const errors: RowError[] = [];
  const duplicated: RowError[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < grid.rows.length; i++) {
    const rowNumber = i + 1; // 1 = primera fila de datos
    const cols = grid.rows[i].map((c) => String(c ?? '').trim());

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

    // `Number('')` es 0: sin este guardia, una celda de la plantilla que el
    // usuario dejó en blanco entraría como cuota/venta cero en vez de avisar.
    const cuota = cuotaRaw === '' ? NaN : Number(cuotaRaw);
    const ventaReal = ventaRaw === '' ? NaN : Number(ventaRaw);
    if (!Number.isFinite(cuota) || cuota < 0)
      rowErrors.push('cuota vacía, no numérica o negativa');
    if (!Number.isFinite(ventaReal) || ventaReal < 0)
      rowErrors.push('venta vacía, no numérica o negativa');

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
