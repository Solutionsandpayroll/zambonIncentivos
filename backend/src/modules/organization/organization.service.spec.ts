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
