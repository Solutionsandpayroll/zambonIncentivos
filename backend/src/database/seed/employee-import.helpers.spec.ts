import {
  splitFullName,
  excelSerialToDate,
  parseCellDate,
  employeeCodeFromDocument,
  suggestUsername,
  nameKey,
  nameSimilarity,
  roundMoney,
} from './employee-import.helpers';

describe('splitFullName', () => {
  it('separa dos apellidos + dos nombres', () => {
    const r = splitFullName('ALBARRACIN MACKENZIE ALDO JOSE');
    expect(r.lastName).toBe('ALBARRACIN MACKENZIE');
    expect(r.firstName).toBe('ALDO JOSE');
    expect(r.ambiguous).toBe(false);
  });

  it('separa dos apellidos + un nombre', () => {
    const r = splitFullName('SOTO CATALINA ANDREA');
    expect(r.lastName).toBe('SOTO CATALINA');
    expect(r.firstName).toBe('ANDREA');
  });

  it('marca como ambiguo un apellido con partícula y lo absorbe', () => {
    const r = splitFullName('LA ROTTA ESQUIVEL SANDRA MILENA');
    expect(r.lastName).toBe('LA ROTTA ESQUIVEL');
    expect(r.firstName).toBe('SANDRA MILENA');
    expect(r.ambiguous).toBe(true);
  });

  it('maneja dos tokens', () => {
    const r = splitFullName('SALGUERO JOHANNA');
    expect(r.lastName).toBe('SALGUERO');
    expect(r.firstName).toBe('JOHANNA');
  });

  it('colapsa espacios extra y conserva fullName normalizado', () => {
    const r = splitFullName('  ARIZA   PEREZ INES PATRICIA  ');
    expect(r.fullName).toBe('ARIZA PEREZ INES PATRICIA');
    expect(r.lastName).toBe('ARIZA PEREZ');
  });

  it('marca ambiguo un solo token o vacío', () => {
    expect(splitFullName('SOTO').ambiguous).toBe(true);
    expect(splitFullName('   ').ambiguous).toBe(true);
  });
});

describe('excelSerialToDate', () => {
  it('convierte seriales reales del archivo', () => {
    // 41728 → 2014-03-30 (fecha de ingreso de ALBARRACIN)
    expect(excelSerialToDate(41728).toISOString().slice(0, 10)).toBe('2014-03-30');
    // 44481 → 2021-10-12
    expect(excelSerialToDate(44481).toISOString().slice(0, 10)).toBe('2021-10-12');
  });

  it('ancla correctamente la época de Excel (serial 1 = 1899-12-31)', () => {
    expect(excelSerialToDate(1).toISOString().slice(0, 10)).toBe('1899-12-31');
  });
});

describe('parseCellDate', () => {
  it('acepta serial numérico', () => {
    expect(parseCellDate(41728)?.toISOString().slice(0, 10)).toBe('2014-03-30');
  });

  it('acepta Date tal cual', () => {
    const d = new Date('2020-01-15T00:00:00Z');
    expect(parseCellDate(d)).toBe(d);
  });

  it('acepta texto ISO y rechaza basura', () => {
    expect(parseCellDate('2020-01-15')?.toISOString().slice(0, 10)).toBe('2020-01-15');
    expect(parseCellDate('no es fecha')).toBeNull();
    expect(parseCellDate(null)).toBeNull();
    expect(parseCellDate('')).toBeNull();
  });
});

describe('employeeCodeFromDocument', () => {
  it('deriva un código estable', () => {
    expect(employeeCodeFromDocument('43455696')).toBe('EMP-43455696');
    expect(employeeCodeFromDocument(' 123 ')).toBe('EMP-123');
  });
});

describe('nameKey', () => {
  it('ignora el orden de los tokens', () => {
    expect(nameKey('SOTO CATALINA ANDREA')).toBe(nameKey('CATALINA ANDREA SOTO'));
  });

  it('ignora acentos y puntuación', () => {
    expect(nameKey('ALBARRACÍN MACKENZIE')).toBe(nameKey('ALBARRACIN MACKENZIE'));
  });
});

describe('nameSimilarity', () => {
  // Casos reales del cruce baseempleados.xlsx ↔ salariosbases.xlsx
  it('vincula POVEDA pese al orden invertido y nombre parcial', () => {
    const score = nameSimilarity('JOLTMANTH POVEDA', 'POVEDA DIAZ JOLMANTH JOSE');
    // "JOLTMANTH" vs "JOLMANTH" difieren: comparten solo POVEDA de 2 tokens
    expect(score).toBeGreaterThanOrEqual(0.5);
  });

  it('vincula ARISTIZABAL con alta similitud', () => {
    const score = nameSimilarity(
      'JUAN ESTEBAN ARISTIZABAL',
      'ARISTIZABAL MORENO JUAN ESTEBAN',
    );
    expect(score).toBe(1); // los 3 tokens del corto están en el largo
  });

  it('da 1 cuando un nombre está contenido en el otro', () => {
    expect(nameSimilarity('CATALINA SOTO', 'SOTO CATALINA ANDREA')).toBe(1);
  });

  it('da bajo para personas distintas', () => {
    expect(
      nameSimilarity('ANA MARIA GUZMAN', 'CARLOS ANDRES GERENA BALLEN'),
    ).toBeLessThan(0.4);
  });

  it('no falla con cadenas vacías', () => {
    expect(nameSimilarity('', 'ALGO')).toBe(0);
  });
});

describe('roundMoney', () => {
  it('limpia el ruido de coma flotante de Excel', () => {
    expect(roundMoney(2099096.999999999)).toBe(2099097);
    expect(roundMoney(2554624.9999999995)).toBe(2554625);
    expect(roundMoney(3267499.999999998)).toBe(3267500);
  });

  it('conserva centavos legítimos', () => {
    expect(roundMoney(930720.55)).toBe(930720.55);
    expect(roundMoney(914100)).toBe(914100);
  });
});

describe('suggestUsername', () => {
  it('usa inicial del nombre + primer apellido', () => {
    expect(suggestUsername('CATALINA ANDREA', 'SOTO')).toBe('csoto');
  });

  it('quita acentos y caracteres no alfabéticos (Ñ → n)', () => {
    expect(suggestUsername('JOSÉ', 'MUÑOZ MEDINA')).toBe('jmunoz');
  });
});
