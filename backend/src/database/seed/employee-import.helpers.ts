/**
 * Helpers PUROS para migrar la base de empleados desde Excel.
 * Aislados y testeados porque un error aquí corrompe la base de personas.
 */

/**
 * El Excel trae el nombre como "APELLIDOS NOMBRES" en una sola celda
 * (ej. "SOTO CATALINA ANDREA", "ALBARRACIN MACKENZIE ALDO JOSE").
 *
 * Convención colombiana: los DOS primeros tokens son apellidos y el resto
 * nombres. Con 3 tokens se asume 1 apellido + 2 nombres solo si el tercero
 * existe; con 2 tokens, 1 apellido + 1 nombre.
 *
 * Es una heurística: casos ambiguos (apellidos compuestos como "LA ROTTA")
 * quedan marcados para revisión manual mediante `ambiguous`.
 */
export interface SplitName {
  lastName: string;
  firstName: string;
  fullName: string;
  ambiguous: boolean;
}

/** Partículas que forman apellidos compuestos (no cuentan como token propio). */
const PARTICLES = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'SAN', 'SANTA', 'VAN', 'DA']);

export function splitFullName(raw: string): SplitName {
  const fullName = raw.trim().replace(/\s+/g, ' ');
  const tokens = fullName.split(' ');

  if (tokens.length === 0 || fullName === '') {
    return { lastName: '', firstName: '', fullName, ambiguous: true };
  }
  if (tokens.length === 1) {
    return { lastName: tokens[0], firstName: '', fullName, ambiguous: true };
  }
  if (tokens.length === 2) {
    return {
      lastName: tokens[0],
      firstName: tokens[1],
      fullName,
      ambiguous: false,
    };
  }

  // Absorbe partículas: "LA ROTTA ESQUIVEL SANDRA MILENA" → apellidos "LA ROTTA ESQUIVEL"
  let lastNameTokens = 2;
  if (PARTICLES.has(tokens[0].toUpperCase())) {
    lastNameTokens = 3;
  }
  const ambiguous = PARTICLES.has(tokens[0].toUpperCase());

  return {
    lastName: tokens.slice(0, lastNameTokens).join(' '),
    firstName: tokens.slice(lastNameTokens).join(' '),
    fullName,
    ambiguous,
  };
}

/**
 * Convierte un serial de fecha de Excel a Date (UTC).
 * Excel cuenta días desde 1899-12-30 (por el bug del año bisiesto 1900).
 * Ej: 41728 → 2014-03-14.
 */
export function excelSerialToDate(serial: number): Date {
  const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return new Date(EXCEL_EPOCH_UTC + Math.round(serial) * MS_PER_DAY);
}

/**
 * Normaliza un valor de celda que puede venir como serial numérico, Date real
 * o texto ISO. Devuelve null si no se puede interpretar.
 */
export function parseCellDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return excelSerialToDate(value);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

/**
 * Deriva un código de empleado estable a partir del documento.
 * `employee_code` es NOT NULL @unique y el Excel no lo trae.
 */
export function employeeCodeFromDocument(documentNumber: string): string {
  return `EMP-${documentNumber.trim()}`;
}

/**
 * Clave de comparación de nombres entre archivos distintos.
 *
 * `baseempleados.xlsx` trae "APELLIDOS NOMBRES" y `salariosbases.xlsx` trae
 * "NOMBRES APELLIDOS" — el mismo humano en distinto orden, con acentos
 * inconsistentes ("ALBARRACIN" vs "ALBARRACÍN") y espacios dobles.
 *
 * Normaliza: sin acentos, mayúsculas, sin puntuación, tokens ORDENADOS
 * alfabéticamente. Así "SOTO CATALINA ANDREA" y "CATALINA SOTO" comparten los
 * tokens que tienen en común, independientemente del orden.
 */
export function nameKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .sort()
    .join(' ');
}

/**
 * Similitud entre dos nombres: proporción de tokens compartidos respecto al
 * nombre más corto (índice de Szymkiewicz–Simpson). Devuelve 0..1.
 *
 * Se usa para vincular filas cuyo documento viene en 0. Un umbral alto (≥0.8)
 * evita falsos positivos entre homónimos parciales.
 */
export function nameSimilarity(a: string, b: string): number {
  const ta = new Set(nameKey(a).split(' ').filter(Boolean));
  const tb = new Set(nameKey(b).split(' ').filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;

  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;

  return shared / Math.min(ta.size, tb.size);
}

/**
 * Redondea a 2 decimales, limpiando el ruido de coma flotante que traen los
 * salarios calculados en Excel (ej. 2099096.999999999 → 2099097).
 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Genera un username sugerido: primera inicial del nombre + primer apellido,
 * en minúsculas y sin acentos/espacios. Ej. "CATALINA" + "SOTO" → "csoto".
 * Puede colisionar: el llamador debe desambiguar (sufijo numérico).
 */
export function suggestUsername(firstName: string, lastName: string): string {
  const strip = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z]/g, '')
      .toLowerCase();

  const first = strip(firstName.split(' ')[0] ?? '');
  const last = strip(lastName.split(' ')[0] ?? '');
  const base = `${first.charAt(0)}${last}`;
  return base || 'usuario';
}
