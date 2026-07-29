import { OrganizationService } from './organization.service';

/**
 * Reglas de negocio de organization: creación de jerarquía (sin auto-jefe, sin
 * duplicar relación vigente). Prisma y ScopeService mockeados.
 */
describe('OrganizationService.createHierarchy', () => {
  function makeService(overrides: Record<string, any> = {}) {
    const prisma = {
      employee: {
        findUnique: jest.fn().mockResolvedValue({ employeeId: 'x' }),
      },
      orgHierarchy: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ orgHierarchyId: 'h1' }),
      },
      ...overrides,
    };
    const scope = {};
    return {
      service: new OrganizationService(prisma as never, scope as never),
      prisma,
    };
  }

  const dto = {
    managerEmployeeId: 'm1',
    subordinateEmployeeId: 's1',
    validFrom: '2025-01-01',
  };

  it('crea la relación cuando es válida', async () => {
    const { service, prisma } = makeService();
    await service.createHierarchy(dto);
    expect(prisma.orgHierarchy.create).toHaveBeenCalledTimes(1);
  });

  it('rechaza que un empleado sea su propio jefe', async () => {
    const { service } = makeService();
    await expect(
      service.createHierarchy({ ...dto, subordinateEmployeeId: 'm1' }),
    ).rejects.toThrow(/su propio jefe/i);
  });

  it('rechaza si el jefe o el subordinado no existen', async () => {
    const { service } = makeService({
      employee: { findUnique: jest.fn().mockResolvedValue(null) },
    });
    await expect(service.createHierarchy(dto)).rejects.toThrow(/inexistente/i);
  });

  it('rechaza duplicar una relación vigente idéntica', async () => {
    const { service } = makeService({
      orgHierarchy: {
        findFirst: jest.fn().mockResolvedValue({ orgHierarchyId: 'ya-existe' }),
        create: jest.fn(),
      },
    });
    await expect(service.createHierarchy(dto)).rejects.toThrow(/ya existe/i);
  });
});

describe('OrganizationService.updateEmployee', () => {
  function makeService(overrides: Record<string, any> = {}) {
    const tx = {
      person: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ firstName: 'ANA', lastName: 'GUZMAN' }),
        update: jest.fn().mockResolvedValue({}),
      },
      employee: { update: jest.fn().mockResolvedValue({ employeeId: 'e1' }) },
    };
    const prisma = {
      employee: {
        findUnique: jest.fn().mockResolvedValue({ employeeId: 'e1', personId: 'p1' }),
      },
      zone: { findUnique: jest.fn().mockResolvedValue({ zoneId: 'z1' }) },
      position: { findUnique: jest.fn().mockResolvedValue({ positionId: 'c1' }) },
      $transaction: jest.fn(async (fn: any) => fn(tx)),
      ...overrides,
    };
    return { service: new OrganizationService(prisma as never, {} as never), prisma, tx };
  }

  it('rechaza un empleado inexistente', async () => {
    const { service } = makeService({ employee: { findUnique: jest.fn().mockResolvedValue(null) } });
    await expect(service.updateEmployee('nope', { baseSalary: 1 })).rejects.toThrow(
      /empleado no existe/i,
    );
  });

  it('actualiza el salario sin tocar los datos de la persona', async () => {
    const { service, tx } = makeService();
    await service.updateEmployee('e1', { baseSalary: 2500000 });
    expect(tx.employee.update).toHaveBeenCalledTimes(1);
    expect(tx.person.update).not.toHaveBeenCalled();
  });

  it('recompone el nombre completo al cambiar solo el apellido', async () => {
    const { service, tx } = makeService();
    await service.updateEmployee('e1', { lastName: 'GUZMAN ROJAS' });
    expect(tx.person.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: 'ANA',
          lastName: 'GUZMAN ROJAS',
          fullName: 'ANA GUZMAN ROJAS',
        }),
      }),
    );
  });

  it('desactiva al empleado sin borrarlo', async () => {
    const { service, tx } = makeService();
    await service.updateEmployee('e1', { active: false });
    expect(tx.employee.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ active: false }) }),
    );
  });

  it('no modifica campos que no llegan en el DTO', async () => {
    const { service, tx } = makeService();
    await service.updateEmployee('e1', { active: true });
    const data = tx.employee.update.mock.calls[0][0].data;
    expect(Object.keys(data)).toEqual(['active']);
  });

  it('rechaza una zona inexistente', async () => {
    const { service } = makeService({ zone: { findUnique: jest.fn().mockResolvedValue(null) } });
    await expect(service.updateEmployee('e1', { zoneId: 'z9' })).rejects.toThrow(
      /zona no existe/i,
    );
  });
});

describe('OrganizationService — edición de estructura', () => {
  function makeService(overrides: Record<string, any> = {}) {
    const prisma = {
      team: {
        findUnique: jest.fn().mockResolvedValue({ teamId: 't1' }),
        update: jest.fn().mockResolvedValue({ teamId: 't1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      position: {
        findUnique: jest.fn().mockResolvedValue({ positionId: 'c1' }),
        update: jest.fn().mockResolvedValue({ positionId: 'c1' }),
      },
      region: {
        findUnique: jest.fn().mockResolvedValue({ regionId: 'r1' }),
        update: jest.fn().mockResolvedValue({ regionId: 'r1' }),
      },
      zone: {
        findUnique: jest.fn().mockResolvedValue({ zoneId: 'z1' }),
        update: jest.fn().mockResolvedValue({ zoneId: 'z1' }),
      },
      ...overrides,
    };
    return { service: new OrganizationService(prisma as never, {} as never), prisma };
  }

  it('renombra un equipo', async () => {
    const { service, prisma } = makeService();
    await service.updateTeam('t1', { teamName: 'Nuevo nombre' });
    expect(prisma.team.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { teamName: 'Nuevo nombre' } }),
    );
  });

  it('desactiva en vez de borrar', async () => {
    const { service, prisma } = makeService();
    await service.updateTeam('t1', { active: false });
    expect(prisma.team.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { active: false } }),
    );
  });

  it('rechaza entidades inexistentes', async () => {
    const cases: [string, () => Promise<unknown>, RegExp][] = [];
    const t = makeService({ team: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() } });
    cases.push(['equipo', () => t.service.updateTeam('x', {}), /equipo no existe/i]);
    const p = makeService({ position: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() } });
    cases.push(['cargo', () => p.service.updatePosition('x', {}), /cargo no existe/i]);
    const z = makeService({ zone: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() } });
    cases.push(['zona', () => z.service.updateZone('x', {}), /zona no existe/i]);

    for (const [, run, pattern] of cases) {
      await expect(run()).rejects.toThrow(pattern);
    }
  });

  it('rechaza mover una zona a una región inexistente', async () => {
    const { service } = makeService({
      region: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
    });
    await expect(service.updateZone('z1', { regionId: 'r9' })).rejects.toThrow(
      /región no existe/i,
    );
  });

  it('los listados ocultan los inactivos salvo que se pidan', async () => {
    const { service, prisma } = makeService();
    await service.listTeams();
    expect(prisma.team.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } }),
    );
    await service.listTeams(true);
    expect(prisma.team.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
});

describe('OrganizationService.createZone', () => {
  it('rechaza crear zona con región inexistente', async () => {
    const prisma = {
      region: { findUnique: jest.fn().mockResolvedValue(null) },
      zone: { create: jest.fn() },
    };
    const service = new OrganizationService(prisma as never, {} as never);
    await expect(
      service.createZone({ zoneName: 'X', regionId: 'r1' }),
    ).rejects.toThrow(/región no existe/i);
  });
});
