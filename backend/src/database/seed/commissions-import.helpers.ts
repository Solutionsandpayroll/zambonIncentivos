/**
 * Lógica pura de extracción del libro `calculocomisiones.xlsx`.
 *
 * El libro es la hoja de cálculo que hacía el trabajo que hoy hace el motor:
 * mezcla ENTRADA (cuota, venta) con RESULTADO (% cumplimiento, % tabla, total).
 * Aquí solo se extrae la entrada; los resultados los produce el sistema y sirven
 * únicamente para contrastar (ver `expectedTotal`).
 *
 * Estructura de una hoja de equipo:
 *
 *     fila N     |  <n>  COMPONENTE DE VENTAS: <NOMBRE> (<peso>%)   ...   <peso>
 *     fila N+2   |  CEDULA | Representante | % | CUOTA | VENTA | % CUMP | % TABLA | TOTAL
 *     fila N+3.. |  <datos por empleado, hasta la primera fila sin cédula>
 *
 * Sin dependencias de Prisma ni de disco: recibe filas ya leídas y devuelve
 * estructuras planas, para poder probarlo sin base de datos ni Excel.
 */

/** Marcador del Excel para "sin cuota asignada" (evita división por cero). */
export const PLACEHOLDER_VALUE = 1;

/** Una fila de datos de un bloque de componente. */
export interface ComponentRow {
  documentNumber: string;
  employeeName: string;
  quota: number;
  sale: number;
  /** `TOTAL` calculado por el Excel. No se importa: sirve para contrastar. */
  expectedTotal: number | null;
  /** Cuota y venta son ambas 1: marcador, no un dato real. */
  isPlaceholder: boolean;
}

/** Un bloque de componente dentro de una hoja de equipo. */
export interface ComponentBlock {
  /** Número de orden dentro de la hoja (1, 2, 3...). */
  index: number;
  /** Nombre tal como aparece en el Excel, ya sin el "(30%)" final. */
  name: string;
  /** Peso como fracción (0.3), o null si el encabezado no lo declara. */
  weight: number | null;
  headerRow: number;
  rows: ComponentRow[];
}

/** Valor de celda ya normalizado a texto (resuelve fórmulas y texto enriquecido). */
export type CellValue = string | number | null | undefined;

/** Una fila del Excel como arreglo indexado desde 1 (col 1 = índice 1). */
export type SheetRow = CellValue[];

/**
 * Normaliza una celda a texto plano. ExcelJS devuelve objetos para fórmulas
 * (`{ result }`), texto enriquecido (`{ richText }`) e hipervínculos (`{ text }`).
 */
export function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (v.result !== undefined) return String(v.result);
    if (Array.isArray(v.richText)) {
      return (v.richText as { text: string }[]).map((t) => t.text).join('');
    }
    if (typeof v.text === 'string') return v.text;
    return '';
  }
  return String(value);
}

/** Convierte a número; devuelve null si no es un número utilizable. */
export function toNumber(value: unknown): number | null {
  const text = cellToString(value).trim().replace(/,/g, '');
  if (text === '') return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/** Documento válido: 6 a 11 dígitos, sin separadores. */
export function isDocumentNumber(value: unknown): boolean {
  return /^\d{6,11}$/.test(cellToString(value).trim());
}

/**
 * Extrae nombre y peso del encabezado de un bloque.
 * `"COMPONENTE DE VENTAS: SELL OUT TOTAL FLUIMUCIL (30%)"` → nombre + 0.3.
 */
export function parseComponentHeader(text: string): {
  name: string;
  weight: number | null;
} | null {
  const cleaned = cellToString(text).trim();
  if (!/COMPONENTE\s+DE\s+VENTAS?/i.test(cleaned)) return null;

  // "T. Componente de ventas (80%)" es la fila de TOTALES del bloque 80%, no un
  // componente. Sin este descarte se importaría como un componente más.
  if (/^T\.?\s*COMPONENTE/i.test(cleaned)) return null;

  const afterColon = cleaned.includes(':')
    ? cleaned.slice(cleaned.indexOf(':') + 1)
    : cleaned.replace(/COMPONENTE\s+DE\s+VENTAS?/i, '');

  const percentMatch = afterColon.match(/\((\d+(?:[.,]\d+)?)\s*%\)/);
  const weight = percentMatch
    ? Number(percentMatch[1].replace(',', '.')) / 100
    : null;

  const name = afterColon
    .replace(/\((?:\d+(?:[.,]\d+)?)\s*%\)/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return name ? { name, weight } : null;
}

/**
 * Código estable a partir del nombre del componente: mayúsculas, sin acentos,
 * separado por guion bajo. `"% Order Taking"` → `ORDER_TAKING`.
 */
export function toComponentCode(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Clasifica el componente según su nombre (enum ComponentType del esquema). */
export function inferComponentType(
  name: string,
): 'MEDICINE' | 'ORDER_TAKING' | 'SELL_OUT' | 'INSTALLATION' | 'OTHER' {
  const n = name.toUpperCase();
  if (/ORDER\s*TAKING/.test(n)) return 'ORDER_TAKING';
  if (/SELL\s*OUT/.test(n)) return 'SELL_OUT';
  if (/INSTALACION|INSTALLATION/.test(n)) return 'INSTALLATION';
  if (/UNIDAD|MEDICAMENTO|MEDICINE/.test(n)) return 'MEDICINE';
  return 'OTHER';
}

/** Índices de columna de la tabla de un bloque, según su fila de cabecera. */
interface ColumnMap {
  document: number;
  quota: number;
  sale: number;
  total: number | null;
  name: number | null;
}

/**
 * Localiza las columnas por nombre de cabecera. Las hojas no comparten el mismo
 * desplazamiento (unas empiezan en la columna 1, otras en la 2), así que se
 * buscan por texto en vez de asumir posiciones fijas.
 */
export function mapColumns(headerRow: SheetRow): ColumnMap | null {
  let document = -1;
  let quota = -1;
  let sale = -1;
  let total: number | null = null;
  let name: number | null = null;

  for (let col = 1; col < headerRow.length; col++) {
    const text = cellToString(headerRow[col]).trim().toUpperCase();
    if (!text) continue;
    if (document < 0 && /^(CEDULA|IDENTIFICACI[OÓ]N)/.test(text)) document = col;
    else if (quota < 0 && /^CUOTA/.test(text)) quota = col;
    else if (sale < 0 && /^(VENTA|ACUMULADO)/.test(text)) sale = col;
    else if (total === null && /^TOTAL/.test(text)) total = col;
    else if (name === null && /^(REPRESENTANTE|NOMBRE)/.test(text)) name = col;
  }

  if (document < 0 || quota < 0 || sale < 0) return null;
  return { document, quota, sale, total, name };
}

/**
 * Un producto de una tabla "por producto" (segundo formato del libro).
 *
 * Estas hojas no repiten los datos por empleado: declaran una tabla única con
 * una fila por producto, y esa cuota aplica a todo el equipo.
 *
 *     PRODUCTO            |  %  |   CUOTA    |   VENTA    | % CUMP | ...
 *     XADAGO (COM + IND)  | 0.8 | 2279515481 | 2182744995 |  0.96  | ...
 *     URSACOL             | 0.2 |  699164348 | 1256377172 |  1.80  | ...
 *     TOTAL               |  1  |            |            |        | ...
 */
export interface ProductRow {
  productName: string;
  weight: number;
  quota: number;
  sale: number;
  expectedTotal: number | null;
}

/** Cabeceras de la tabla por producto. */
interface ProductColumnMap {
  product: number;
  weight: number;
  quota: number;
  sale: number;
  total: number | null;
}

function mapProductColumns(headerRow: SheetRow): ProductColumnMap | null {
  let product = -1;
  let weight = -1;
  let quota = -1;
  let sale = -1;
  let total: number | null = null;

  for (let col = 1; col < headerRow.length; col++) {
    const text = cellToString(headerRow[col]).trim().toUpperCase();
    if (!text) continue;
    // "PRODUCTO", y también "Representante" cuando la hoja reusa esa cabecera
    // para listar productos (Coor. TM).
    if (product < 0 && /^(PRODUCTO|REPRESENTANTE)/.test(text)) product = col;
    else if (weight < 0 && text === '%') weight = col;
    else if (quota < 0 && /^CUOTA/.test(text)) quota = col;
    else if (sale < 0 && /^VENTA/.test(text)) sale = col;
    else if (total === null && /^TOTAL/.test(text)) total = col;
  }

  if (product < 0 || weight < 0 || quota < 0 || sale < 0) return null;
  return { product, weight, quota, sale, total };
}

/**
 * Extrae la tabla por producto de una hoja. Devuelve vacío si la hoja no usa
 * este formato (entonces corresponde `extractBlocks`).
 *
 * La tabla termina en la fila `TOTAL`, que es un subtotal y no un producto.
 */
export function extractProductTable(rows: SheetRow[]): ProductRow[] {
  for (let i = 0; i < rows.length; i++) {
    const columns = mapProductColumns(rows[i] ?? []);
    if (!columns) continue;

    const products: ProductRow[] = [];
    for (let j = i + 1; j < rows.length; j++) {
      const row = rows[j] ?? [];
      const name = cellToString(row[columns.product]).trim();

      if (!name) break; // fin de la tabla
      if (/^TOTAL/i.test(name)) break; // subtotal, no es un producto

      const weight = toNumber(row[columns.weight]);
      const quota = toNumber(row[columns.quota]);
      const sale = toNumber(row[columns.sale]);
      if (weight === null || quota === null || sale === null) continue;

      products.push({
        productName: name,
        weight,
        quota,
        sale,
        expectedTotal: columns.total ? toNumber(row[columns.total]) : null,
      });
    }

    if (products.length > 0) return products;
  }

  return [];
}

/**
 * Recorre una hoja de equipo y devuelve sus bloques de componente con datos.
 *
 * Un bloque se cierra en la primera fila sin documento válido, que es como el
 * Excel separa visualmente un componente del siguiente.
 */
export function extractBlocks(rows: SheetRow[]): ComponentBlock[] {
  const blocks: ComponentBlock[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    // ¿Alguna celda de esta fila declara un componente?
    let header: { name: string; weight: number | null } | null = null;
    for (let col = 1; col < row.length; col++) {
      header = parseComponentHeader(cellToString(row[col]));
      if (header) break;
    }
    if (!header) continue;

    // El peso puede venir en el título o suelto en una celda a la derecha.
    let weight = header.weight;
    if (weight === null) {
      for (let col = 1; col < row.length; col++) {
        const n = toNumber(row[col]);
        if (n !== null && n > 0 && n < 1) {
          weight = n;
          break;
        }
      }
    }

    // La cabecera de la tabla aparece dentro de las 4 filas siguientes.
    let headerRowIndex = -1;
    let columns: ColumnMap | null = null;
    for (let j = i + 1; j <= Math.min(i + 4, rows.length - 1); j++) {
      const candidate = mapColumns(rows[j] ?? []);
      if (candidate) {
        headerRowIndex = j;
        columns = candidate;
        break;
      }
    }
    if (!columns || headerRowIndex < 0) continue;

    const dataRows: ComponentRow[] = [];
    for (let j = headerRowIndex + 1; j < rows.length; j++) {
      const dataRow = rows[j] ?? [];
      if (!isDocumentNumber(dataRow[columns.document])) break; // fin del bloque

      const quota = toNumber(dataRow[columns.quota]);
      const sale = toNumber(dataRow[columns.sale]);
      if (quota === null || sale === null) continue;

      dataRows.push({
        documentNumber: cellToString(dataRow[columns.document]).trim(),
        employeeName: columns.name
          ? cellToString(dataRow[columns.name]).trim()
          : '',
        quota,
        sale,
        expectedTotal: columns.total ? toNumber(dataRow[columns.total]) : null,
        isPlaceholder:
          quota === PLACEHOLDER_VALUE && sale === PLACEHOLDER_VALUE,
      });
    }

    if (dataRows.length > 0) {
      blocks.push({
        index: blocks.length + 1,
        name: header.name,
        weight,
        headerRow: headerRowIndex + 1, // 1-based, para mensajes al usuario
        rows: dataRows,
      });
    }

    i = headerRowIndex; // seguir buscando después de esta cabecera
  }

  return blocks;
}
