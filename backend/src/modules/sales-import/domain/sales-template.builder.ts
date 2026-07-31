/**
 * ============================================================================
 *  Constructor de la plantilla de ventas (.xlsx) — réplica de plantillaventas.xlsx.
 *
 *  La plantilla sale ya rotulada para un (periodo, equipo): una fila por cada
 *  combinación empleado × componente del equipo, con el periodo repetido y el
 *  código de componente puesto. El usuario solo llena Cuota y Venta.
 *
 *  A la derecha, un bloque de referencia con los componentes del equipo, para
 *  que quien la llena vea qué códigos son válidos sin salir del archivo.
 * ============================================================================
 */
import * as ExcelJS from 'exceljs';

export interface TemplateEmployee {
  /** Solo para cruzar con las cuotas ya cargadas; no se escribe en la hoja. */
  employeeId?: string;
  documentNumber: string;
  fullName: string;
}

export interface TemplateComponent {
  /** Solo para cruzar con las cuotas ya cargadas; no se escribe en la hoja. */
  componentId?: string;
  componentCode: string;
  componentName: string;
}

export interface SalesTemplateInput {
  /** 'YYYY-MM' */
  periodLabel: string;
  teamName: string;
  employees: TemplateEmployee[];
  components: TemplateComponent[];
  /**
   * Cuotas ya cargadas del periodo, indexadas por `employeeId|componentId`.
   * Se precargan para no volver a teclear lo que el sistema ya sabe; donde no
   * haya cuota la celda queda vacía, que es distinto de una cuota en cero.
   */
  quotas?: Map<string, number>;
}

export const TEMPLATE_SHEET_NAME = 'plantillaventas';

/**
 * Encabezados. Se conservan los espacios finales del archivo original
 * ('Periodo ', 'Cuota ') para que la plantilla del usuario y la generada sean
 * el mismo archivo; el parser hace trim de todas formas.
 *
 * `Empleado` se añadió después de la primera versión: el documento solo no
 * permite revisar de un vistazo si se está llenando la fila de quien se cree.
 * El parser lo ignora (no está entre las columnas que busca), así que es
 * informativo y no afecta la importación.
 */
const HEADERS = [
  'Numero',
  'Documento',
  'Empleado',
  'Periodo ',
  'Componente',
  'Cuota ',
  'Venta',
];

/** Fila donde empieza la lista de componentes, bajo el bloque combinado I1:J4. */
const COMPONENTS_FIRST_ROW = 5;

export async function buildSalesTemplate(input: SalesTemplateInput): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema de Incentivos Zambon';
  wb.created = new Date();

  const sheet = wb.addWorksheet(TEMPLATE_SHEET_NAME);

  // --- Encabezado de datos (A..F) ---
  // Celda por celda, por el mismo motivo que las filas de datos: `row.values`
  // en la fila 1 borraría el rótulo combinado de I1:J4.
  HEADERS.forEach((h, i) => {
    const cell = sheet.getCell(1, i + 1);
    cell.value = h;
    cell.font = { bold: true };
  });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  sheet.getColumn(1).width = 10; // Numero
  sheet.getColumn(2).width = 16; // Documento
  sheet.getColumn(3).width = 34; // Empleado
  sheet.getColumn(4).width = 12; // Periodo
  sheet.getColumn(5).width = 20; // Componente
  sheet.getColumn(6).width = 14; // Cuota
  sheet.getColumn(7).width = 14; // Venta
  sheet.getColumn(9).width = 24; // I: código
  sheet.getColumn(10).width = 32; // J: nombre

  // --- Bloque de referencia: componentes del equipo ---
  sheet.mergeCells('I1:J4');
  const label = sheet.getCell('I1');
  label.value = `Componentes del Equipo\n${input.teamName}`;
  label.font = { bold: true };
  label.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  input.components.forEach((c, i) => {
    const r = COMPONENTS_FIRST_ROW + i;
    sheet.getCell(r, 9).value = c.componentCode;
    sheet.getCell(r, 10).value = c.componentName;
  });

  // --- Filas de datos: empleado × componente ---
  // Se escribe celda por celda, NO con `row.values`: asignar `values` reemplaza
  // la fila completa y borraría el bloque de referencia de las columnas I/J en
  // las filas que se solapan (la lista de componentes vive en las filas 5+).
  let n = 0;
  for (const emp of input.employees) {
    for (const comp of input.components) {
      n += 1;
      const r = n + 1;
      sheet.getCell(r, 1).value = n;
      sheet.getCell(r, 2).value = emp.documentNumber;
      sheet.getCell(r, 3).value = emp.fullName;
      sheet.getCell(r, 4).value = input.periodLabel;
      sheet.getCell(r, 5).value = comp.componentCode;

      // Cuota (6): se precarga la que ya tenga el sistema para ese
      // (empleado, componente, periodo). Si no hay, la celda queda VACÍA —
      // no en 0, que es un valor legítimo y se importaría como cuota cero.
      const key =
        emp.employeeId && comp.componentId
          ? `${emp.employeeId}|${comp.componentId}`
          : null;
      const quota = key ? input.quotas?.get(key) : undefined;
      if (quota !== undefined) sheet.getCell(r, 6).value = quota;

      // La cuota se muestra como referencia pero NO se edita: vive en el ciclo
      // y el importador la ignora. Si se dejara editable, quien la cambiara
      // creería estar ajustando su cuota y no pasaría nada.
      sheet.getCell(r, 6).protection = { locked: true };

      // Venta (7) siempre vacía: es el dato que viene a traer la plantilla, y
      // la única celda que queda desbloqueada de la fila.
      sheet.getCell(r, 7).protection = { locked: false };
    }
  }

  // Desplegable de componentes en la columna Componente, para no escribirlos a
  // mano. Solo si hay filas y componentes que referenciar.
  if (n > 0 && input.components.length > 0) {
    const lastComponentRow = COMPONENTS_FIRST_ROW + input.components.length - 1;
    for (let r = 2; r <= n + 1; r++) {
      sheet.getCell(r, 5).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`=$I$${COMPONENTS_FIRST_ROW}:$I$${lastComponentRow}`],
        showErrorMessage: true,
        errorTitle: 'Componente inválido',
        error: 'Elige uno de los componentes del equipo listados a la derecha.',
      };
    }
  }

  // Protección de la hoja. Sin esto el `locked` de las celdas no hace nada:
  // en Excel todas las celdas nacen bloqueadas y el atributo solo surte efecto
  // cuando la hoja está protegida. Sin contraseña —no es un secreto, es una
  // barandilla— y dejando pasar lo que el usuario sí necesita hacer.
  await sheet.protect('', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatColumns: true,
    autoFilter: true,
    sort: true,
  });

  // ExcelJS declara su propio Buffer; se normaliza al de Node.
  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as unknown as ArrayBuffer);
}
