import {
  normalize,
  roleForPosition,
  usernameForDocument,
  isUsableDocument,
  planProvisioning,
  EmployeeInput,
} from './user-provisioning.helpers';

describe('normalize', () => {
  it('quita acentos y pasa a minúsculas', () => {
    expect(normalize('Gerente Regional de Ventas')).toBe('gerente regional de ventas');
    expect(normalize('  Coordinación  ')).toBe('coordinación'.normalize('NFD').replace(/[̀-ͯ]/g, ''));
  });
});

describe('roleForPosition', () => {
  it('asigna GERENTE a la línea de dirección', () => {
    expect(roleForPosition('Gerente Regional de ventas')).toBe('GERENTE');
    expect(roleForPosition('Gerente de Distrito')).toBe('GERENTE');
    expect(roleForPosition('Directora DBDT & Sell Out')).toBe('GERENTE');
  });

  it('asigna COORDINADOR a las coordinaciones', () => {
    expect(roleForPosition('Coordinador de farmacias')).toBe('COORDINADOR');
  });

  it('asigna EMPLEADO a los cargos operativos', () => {
    expect(roleForPosition('Representante de farmacias')).toBe('EMPLEADO');
    expect(roleForPosition('Representante Médico Senior')).toBe('EMPLEADO');
    expect(roleForPosition('Commercial Junior Specialist')).toBe('EMPLEADO');
  });

  it('sin cargo asigna EMPLEADO, el rol de menor alcance', () => {
    expect(roleForPosition(null)).toBe('EMPLEADO');
    expect(roleForPosition('')).toBe('EMPLEADO');
    expect(roleForPosition(undefined)).toBe('EMPLEADO');
  });

  it('nunca concede ADMIN ni NOMINA automáticamente', () => {
    const roles = [
      'Gerente Regional de ventas',
      'Coordinador de farmacias',
      'Representante de farmacias',
      'Director Comercial',
    ].map(roleForPosition);
    expect(roles).not.toContain('ADMIN');
    expect(roles).not.toContain('NOMINA');
  });
});

describe('isUsableDocument', () => {
  it('acepta documentos de 6 a 11 dígitos', () => {
    expect(isUsableDocument('1110495490')).toBe(true);
    expect(isUsableDocument('27111025')).toBe(true);
  });

  it('rechaza vacíos, ceros y valores fuera de rango', () => {
    expect(isUsableDocument('0')).toBe(false);
    expect(isUsableDocument('')).toBe(false);
    expect(isUsableDocument(null)).toBe(false);
    expect(isUsableDocument('12345')).toBe(false);
  });
});

describe('usernameForDocument', () => {
  it('usa el documento tal cual, sin espacios', () => {
    expect(usernameForDocument(' 1110495490 ')).toBe('1110495490');
  });
});

describe('planProvisioning', () => {
  const base: EmployeeInput = {
    employeeId: 'e1',
    fullName: 'ANA MARIA GUZMAN',
    documentNumber: '1110495490',
    positionName: 'Representante de farmacias',
    hasUser: false,
  };

  it('planifica usuario y rol para un empleado apto', () => {
    const { plans, skipped } = planProvisioning([base]);
    expect(skipped).toHaveLength(0);
    expect(plans).toEqual([
      { employeeId: 'e1', fullName: 'ANA MARIA GUZMAN', username: '1110495490', role: 'EMPLEADO' },
    ]);
  });

  it('omite a quien ya tiene usuario, para no pisar su contraseña', () => {
    const { plans, skipped } = planProvisioning([{ ...base, hasUser: true }]);
    expect(plans).toHaveLength(0);
    expect(skipped[0].reason).toBe('ya tiene usuario');
  });

  it('omite documentos inválidos en vez de inventar un usuario', () => {
    const { plans, skipped } = planProvisioning([{ ...base, documentNumber: '0' }]);
    expect(plans).toHaveLength(0);
    expect(skipped[0].reason).toBe('documento inválido');
  });

  it('omite el segundo empleado con el mismo documento', () => {
    const { plans, skipped } = planProvisioning([
      base,
      { ...base, employeeId: 'e2', fullName: 'OTRA PERSONA' },
    ]);
    expect(plans).toHaveLength(1);
    expect(plans[0].employeeId).toBe('e1');
    expect(skipped[0]).toMatchObject({ fullName: 'OTRA PERSONA', reason: 'usuario duplicado' });
  });

  it('deriva el rol de cada cargo en un lote mixto', () => {
    const { plans } = planProvisioning([
      { ...base, employeeId: 'e1', documentNumber: '1110495490', positionName: 'Gerente de Distrito' },
      { ...base, employeeId: 'e2', documentNumber: '27111025', positionName: 'Coordinador de farmacias' },
      { ...base, employeeId: 'e3', documentNumber: '43455696', positionName: 'Representante Médico Senior' },
    ]);
    expect(plans.map((p) => p.role)).toEqual(['GERENTE', 'COORDINADOR', 'EMPLEADO']);
  });

  it('devuelve listas vacías sin empleados', () => {
    expect(planProvisioning([])).toEqual({ plans: [], skipped: [] });
  });
});
