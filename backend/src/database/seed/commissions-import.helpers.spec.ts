import {
  cellToString,
  toNumber,
  isDocumentNumber,
  parseComponentHeader,
  toComponentCode,
  inferComponentType,
  mapColumns,
  extractBlocks,
  SheetRow,
} from './commissions-import.helpers';

describe('cellToString', () => {
  it('resuelve fórmulas, texto enriquecido e hipervínculos de ExcelJS', () => {
    expect(cellToString({ result: 1234.5 })).toBe('1234.5');
    expect(cellToString({ richText: [{ text: 'SELL ' }, { text: 'OUT' }] })).toBe('SELL OUT');
    expect(cellToString({ text: 'enlace' })).toBe('enlace');
  });

  it('devuelve cadena vacía para celdas vacías', () => {
    expect(cellToString(null)).toBe('');
    expect(cellToString(undefined)).toBe('');
  });
});

describe('toNumber', () => {
  it('acepta números con separador de miles y descarta lo no numérico', () => {
    expect(toNumber('16,400,000')).toBe(16400000);
    expect(toNumber({ result: 0.3 })).toBe(0.3);
    expect(toNumber('N/A')).toBeNull();
    expect(toNumber('')).toBeNull();
  });

  it('conserva el cero como valor válido', () => {
    expect(toNumber(0)).toBe(0);
  });
});

describe('isDocumentNumber', () => {
  it('acepta documentos de 6 a 11 dígitos', () => {
    expect(isDocumentNumber('1098666680')).toBe(true);
    expect(isDocumentNumber('27111025')).toBe(true);
  });

  it('rechaza texto y números fuera de rango', () => {
    expect(isDocumentNumber('CEDULA')).toBe(false);
    expect(isDocumentNumber('12345')).toBe(false);
    expect(isDocumentNumber('123456789012')).toBe(false);
  });
});

describe('parseComponentHeader', () => {
  it('extrae nombre y peso del título del bloque', () => {
    expect(
      parseComponentHeader('COMPONENTE DE VENTAS: SELL OUT TOTAL  FLUIMUCIL (30%)'),
    ).toEqual({ name: 'SELL OUT TOTAL FLUIMUCIL', weight: 0.3 });
  });

  it('extrae el nombre aunque el título no declare el peso', () => {
    expect(parseComponentHeader('COMPONENTE DE VENTAS: % Order Taking')).toEqual({
      name: '% Order Taking',
      weight: null,
    });
  });

  it('ignora encabezados que no son de componente', () => {
    expect(parseComponentHeader('T. Componente de ventas (80%)')).toBeNull();
    expect(parseComponentHeader('CALCULO DE SALARIO VARIABLE')).toBeNull();
  });
});

describe('toComponentCode', () => {
  it('normaliza a mayúsculas sin acentos ni símbolos', () => {
    expect(toComponentCode('% Order Taking')).toBe('ORDER_TAKING');
    expect(toComponentCode('SELL OUT TOTAL FLUIMUCIL')).toBe('SELL_OUT_TOTAL_FLUIMUCIL');
  });
});

describe('inferComponentType', () => {
  it('clasifica según el nombre del componente', () => {
    expect(inferComponentType('% Order Taking')).toBe('ORDER_TAKING');
    expect(inferComponentType('SELL OUT TOTAL PANOTIL')).toBe('SELL_OUT');
    expect(inferComponentType('Algo distinto')).toBe('OTHER');
  });
});

describe('mapColumns', () => {
  it('localiza las columnas por nombre, sin asumir posiciones fijas', () => {
    const header: SheetRow = [null, 'CEDULA', 'Representante', '%', 'CUOTA', 'VENTA', '% CUMP', '% TABLA', 'TOTAL'];
    expect(mapColumns(header)).toEqual({ document: 1, name: 2, quota: 4, sale: 5, total: 8 });
  });

  it('tolera el desplazamiento de columnas entre hojas', () => {
    const header: SheetRow = [null, null, 'CEDULA', 'REPRESENTANTE', 'CUOTA', 'ACUMULADO'];
    expect(mapColumns(header)).toMatchObject({ document: 2, quota: 4, sale: 5 });
  });

  it('devuelve null si falta alguna columna obligatoria', () => {
    expect(mapColumns([null, 'CEDULA', 'Representante'])).toBeNull();
  });
});

describe('extractBlocks', () => {
  /** Reproduce el formato real de una hoja de equipo (dos bloques seguidos). */
  const sheet: SheetRow[] = [
    [],
    [null, null, '1', 'COMPONENTE DE VENTAS: SELL OUT TOTAL FLUIMUCIL (30%)'],
    [],
    [null, 'CEDULA', 'Representante', '%', 'CUOTA', 'VENTA', '% CUMP', '% TABLA', 'TOTAL'],
    [null, '1110495490', 'ANA MARIA GUZMAN', 0.3, 527.04, 679, 1.29, 1.5, 335059.2],
    [null, '43455696', 'CATALINA SOTO', 0.3, 2918.16, 2520, 0.86, null, null],
    [],
    [null, null, '2', 'COMPONENTE DE VENTAS: % Order Taking (40%)'],
    [],
    [null, 'CEDULA', 'Representante', '%', 'CUOTA', 'VENTA', '% CUMP', '% TABLA', 'TOTAL'],
    [null, '1110495490', 'ANA MARIA GUZMAN', 0.4, 16400000, 26441392, 1.61, 1.5, 446745.6],
    [null, '26946191', 'NORMA PATRICIA', 0.4, 1, 1, 1, 1, 292512],
  ];

  it('detecta ambos bloques con su nombre y peso', () => {
    const blocks = extractBlocks(sheet);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ index: 1, name: 'SELL OUT TOTAL FLUIMUCIL', weight: 0.3 });
    expect(blocks[1]).toMatchObject({ index: 2, name: '% Order Taking', weight: 0.4 });
  });

  it('extrae cuota y venta, y conserva el total del Excel para contrastar', () => {
    const [primero] = extractBlocks(sheet);
    expect(primero.rows).toHaveLength(2);
    expect(primero.rows[0]).toMatchObject({
      documentNumber: '1110495490',
      quota: 527.04,
      sale: 679,
      expectedTotal: 335059.2,
      isPlaceholder: false,
    });
  });

  it('marca como placeholder las filas con cuota y venta en 1', () => {
    const [, segundo] = extractBlocks(sheet);
    const norma = segundo.rows.find((r) => r.documentNumber === '26946191');
    expect(norma?.isPlaceholder).toBe(true);
    // La fila con datos reales del mismo bloque no debe marcarse.
    expect(segundo.rows[0].isPlaceholder).toBe(false);
  });

  it('cierra el bloque en la primera fila sin documento', () => {
    // El primer bloque tiene 2 filas: la fila vacía siguiente lo termina,
    // de modo que las filas del segundo bloque no se le atribuyen.
    const [primero] = extractBlocks(sheet);
    expect(primero.rows.map((r) => r.documentNumber)).toEqual(['1110495490', '43455696']);
  });

  it('devuelve vacío en una hoja sin bloques de componente', () => {
    expect(extractBlocks([[null, 'RESUMEN'], [null, 'TOTAL', 123]])).toEqual([]);
  });

  it('toma el peso de una celda suelta cuando el título no lo declara', () => {
    const conPesoSuelto: SheetRow[] = [
      [null, null, '1', 'COMPONENTE DE VENTAS: RECAUDO', null, null, null, 0.25],
      [null, 'CEDULA', 'Representante', '%', 'CUOTA', 'VENTA'],
      [null, '1110495490', 'ANA MARIA GUZMAN', 0.25, 100, 120],
    ];
    expect(extractBlocks(conPesoSuelto)[0].weight).toBe(0.25);
  });
});
