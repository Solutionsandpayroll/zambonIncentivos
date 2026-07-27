import { parseSalesFile } from './sales-file-parser';

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
