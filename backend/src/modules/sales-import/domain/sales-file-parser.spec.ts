import { parseSalesFile, parseSalesGrid } from './sales-file-parser';

const HEADER = 'documento,nombre_empleado,periodo,componente,cuota,venta_real';

describe('parseSalesFile', () => {
  it('parsea filas válidas (formato largo)', () => {
    const csv = [
      HEADER,
      '1110495490,ANA MARIA GUZMAN,2025-05,MEDICINE,1142.64,1567',
      '1110495490,ANA MARIA GUZMAN,2025-05,ORDER_TAKING,290.52,340',
    ].join('\n');

    const r = parseSalesFile(csv);
    expect(r.valid).toHaveLength(2);
    expect(r.errors).toHaveLength(0);
    expect(r.valid[0]).toMatchObject({
      documento: '1110495490',
      periodo: '2025-05',
      componente: 'MEDICINE',
      cuota: 1142.64,
      ventaReal: 1567,
    });
  });

  it('normaliza el código de componente a mayúsculas', () => {
    const csv = [HEADER, '43455696,CATALINA,2025-05,medicine,855.36,697'].join('\n');
    expect(parseSalesFile(csv).valid[0].componente).toBe('MEDICINE');
  });

  it('lanza si faltan columnas obligatorias', () => {
    const csv = ['documento,periodo,componente', '1,2025-05,MEDICINE'].join('\n');
    expect(() => parseSalesFile(csv)).toThrow(/columnas obligatorias/i);
  });

  it('lanza si el archivo está vacío', () => {
    expect(() => parseSalesFile('')).toThrow(/vac/i);
  });

  it('reporta filas con periodo inválido o números negativos sin abortar', () => {
    const csv = [
      HEADER,
      '1,ANA,2025-5,MEDICINE,100,200', // periodo mal formado
      '2,LUIS,2025-05,MEDICINE,-5,200', // cuota negativa
      '3,EVA,2025-05,MEDICINE,100,200', // válida
    ].join('\n');

    const r = parseSalesFile(csv);
    expect(r.valid).toHaveLength(1);
    expect(r.valid[0].documento).toBe('3');
    expect(r.errors).toHaveLength(2);
    expect(r.errors[0].rowNumber).toBe(1);
  });

  it('detecta duplicados por (documento, periodo, componente)', () => {
    const csv = [
      HEADER,
      '1,ANA,2025-05,MEDICINE,100,200',
      '1,ANA,2025-05,MEDICINE,100,999', // duplicada
    ].join('\n');

    const r = parseSalesFile(csv);
    expect(r.valid).toHaveLength(1);
    expect(r.duplicated).toHaveLength(1);
    expect(r.duplicated[0].rowNumber).toBe(2);
  });
});

describe('parseSalesGrid (rejilla: CSV y XLSX comparten esta lógica)', () => {
  // Encabezado tal como sale de la plantilla XLSX: 'Venta' en vez de
  // 'venta_real', columna 'Numero' de sobra, y espacios finales reales.
  const XLSX_HEADER = ['Numero', 'Documento', 'Periodo ', 'Componente', 'Cuota ', 'Venta'];

  it('acepta el alias "venta" de la plantilla XLSX', () => {
    const r = parseSalesGrid({
      header: XLSX_HEADER,
      rows: [['1', '1110495490', '2025-05', 'FLUIMUCIL_VM', '1142.64', '1567']],
    });
    expect(r.errors).toHaveLength(0);
    expect(r.valid).toHaveLength(1);
    expect(r.valid[0].ventaReal).toBe(1567);
    expect(r.valid[0].cuota).toBe(1142.64);
  });

  it('tolera espacios y mayúsculas en el encabezado', () => {
    const r = parseSalesGrid({
      header: ['  DOCUMENTO ', 'Periodo', ' Componente', 'CUOTA', ' Venta '],
      rows: [['1', '2025-05', 'MEDICINE', '10', '20']],
    });
    expect(r.errors).toHaveLength(0);
    expect(r.valid[0].documento).toBe('1');
  });

  it('ignora la columna Numero y no la confunde con el documento', () => {
    const r = parseSalesGrid({
      header: XLSX_HEADER,
      rows: [['7', '52965381', '2025-05', 'MONURIL_VM', '5', '6']],
    });
    expect(r.valid[0].documento).toBe('52965381');
  });

  it('marca error si la cuota o la venta vienen vacías (no las toma como 0)', () => {
    const r = parseSalesGrid({
      header: XLSX_HEADER,
      rows: [['1', '123', '2025-05', 'MEDICINE', '', '']],
    });
    expect(r.valid).toHaveLength(0);
    expect(r.errors[0].reason).toContain('cuota vacía');
    expect(r.errors[0].reason).toContain('venta vacía');
  });

  it('conserva el 0 explícito como valor legítimo', () => {
    const r = parseSalesGrid({
      header: XLSX_HEADER,
      rows: [['1', '123', '2025-05', 'MEDICINE', '100', '0']],
    });
    expect(r.errors).toHaveLength(0);
    expect(r.valid[0].ventaReal).toBe(0);
  });

  it('exige la columna de venta bajo alguno de sus dos nombres', () => {
    expect(() =>
      parseSalesGrid({ header: ['documento', 'periodo', 'componente', 'cuota'], rows: [] }),
    ).toThrow(/venta/);
  });
});
