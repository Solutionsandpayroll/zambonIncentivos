import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { ScopeService } from '../../common/scope/scope.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import {
  CreateTeamDto,
  CreatePositionDto,
  CreateRegionDto,
  CreateZoneDto,
} from './dto/structure.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateHierarchyDto } from './dto/create-hierarchy.dto';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
  ) {}

  /**
   * Lista empleados aplicando el alcance del usuario: ADMIN/NOMINA ven todo;
   * GERENTE/COORDINADOR solo su árbol; EMPLEADO solo a sí mismo. El filtro se
   * construye en backend (nunca se confía en el frontend).
   */
  listEmployees(user: AuthenticatedUser, filters: { teamId?: string; zoneId?: string }) {
    const allowedIds = this.scope.allowedEmployeeIds(user);

    return this.prisma.employee.findMany({
      where: {
        active: true,
        ...(allowedIds !== null ? { employeeId: { in: allowedIds } } : {}),
        ...(filters.zoneId ? { zoneId: filters.zoneId } : {}),
        ...(filters.teamId
          ? { teamAssignments: { some: { teamId: filters.teamId, active: true } } }
          : {}),
      },
      include: { person: true, zone: true, position: true },
      orderBy: { employeeCode: 'asc' },
    });
  }

  /** Árbol de subordinados (directos e indirectos) de un empleado. */
  async subordinates(user: AuthenticatedUser, employeeId: string) {
    // Un no-ALL solo puede pedir el árbol dentro de su propio alcance.
    this.scope.assertCanAccessEmployee(user, employeeId);
    const ids = await this.scope.resolveSubordinateTree(employeeId);
    return this.prisma.employee.findMany({
      where: { employeeId: { in: ids } },
      include: { person: true },
    });
  }

  // ---- Empleados (crear) --------------------------------------------------
  /**
   * Crea persona + empleado en una transacción. El documento y el employeeCode
   * son únicos; si se repiten el schema responde P2002 → 409 (traducido por el
   * filtro global). Valida zona/cargo si se envían.
   */
  async createEmployee(dto: CreateEmployeeDto) {
    if (dto.zoneId) {
      const zone = await this.prisma.zone.findUnique({ where: { zoneId: dto.zoneId } });
      if (!zone) throw new NotFoundException('La zona no existe');
    }
    if (dto.positionId) {
      const pos = await this.prisma.position.findUnique({
        where: { positionId: dto.positionId },
      });
      if (!pos) throw new NotFoundException('El cargo no existe');
    }

    return this.prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: {
          documentNumber: dto.documentNumber,
          documentType: dto.documentType ?? 'CC',
          firstName: dto.firstName,
          lastName: dto.lastName,
          fullName: `${dto.firstName} ${dto.lastName}`.trim(),
        },
      });
      return tx.employee.create({
        data: {
          personId: person.personId,
          employeeCode: dto.employeeCode,
          baseSalary: new Prisma.Decimal(dto.baseSalary),
          hireDate: dto.hireDate ? new Date(dto.hireDate) : null,
          zoneId: dto.zoneId ?? null,
          positionId: dto.positionId ?? null,
        },
        include: { person: true, zone: true, position: true },
      });
    });
  }

  // ---- Catálogos de estructura --------------------------------------------
  listTeams() {
    return this.prisma.team.findMany({ where: { active: true } });
  }

  createTeam(dto: CreateTeamDto) {
    return this.prisma.team.create({ data: { ...dto } });
  }

  listPositions() {
    return this.prisma.position.findMany({ where: { active: true } });
  }

  createPosition(dto: CreatePositionDto) {
    return this.prisma.position.create({ data: { ...dto } });
  }

  listRegions() {
    return this.prisma.region.findMany({ where: { active: true } });
  }

  createRegion(dto: CreateRegionDto) {
    return this.prisma.region.create({ data: { ...dto } });
  }

  /** Zonas (ciudades) activas, para filtros y selects. */
  listZones(regionId?: string) {
    return this.prisma.zone.findMany({
      where: { active: true, ...(regionId ? { regionId } : {}) },
      include: { region: true },
      orderBy: { zoneName: 'asc' },
    });
  }

  async createZone(dto: CreateZoneDto) {
    const region = await this.prisma.region.findUnique({
      where: { regionId: dto.regionId },
    });
    if (!region) throw new NotFoundException('La región no existe');
    return this.prisma.zone.create({
      data: { zoneName: dto.zoneName, regionId: dto.regionId },
    });
  }

  // ---- Jerarquía (crear relación) -----------------------------------------
  /**
   * Crea una relación jefe–subordinado versionada. Valida que ambos empleados
   * existan y no sean el mismo; evita duplicar una relación vigente idéntica.
   */
  async createHierarchy(dto: CreateHierarchyDto) {
    if (dto.managerEmployeeId === dto.subordinateEmployeeId) {
      throw new ConflictException('Un empleado no puede ser su propio jefe');
    }
    const [manager, sub] = await Promise.all([
      this.prisma.employee.findUnique({ where: { employeeId: dto.managerEmployeeId } }),
      this.prisma.employee.findUnique({ where: { employeeId: dto.subordinateEmployeeId } }),
    ]);
    if (!manager || !sub) {
      throw new NotFoundException('Jefe o subordinado inexistente');
    }

    const existing = await this.prisma.orgHierarchy.findFirst({
      where: {
        managerEmployeeId: dto.managerEmployeeId,
        subordinateEmployeeId: dto.subordinateEmployeeId,
        active: true,
        validTo: null,
      },
    });
    if (existing) {
      throw new ConflictException('Ya existe una relación vigente entre ellos');
    }

    return this.prisma.orgHierarchy.create({
      data: {
        managerEmployeeId: dto.managerEmployeeId,
        subordinateEmployeeId: dto.subordinateEmployeeId,
        validFrom: new Date(dto.validFrom),
        validTo: dto.validTo ? new Date(dto.validTo) : null,
      },
    });
  }

  /** Relaciones jerárquicas vigentes (para la vista de jerarquía). */
  listHierarchy() {
    return this.prisma.orgHierarchy.findMany({
      where: { active: true, validTo: null },
      include: {
        manager: { include: { person: true } },
        subordinate: { include: { person: true } },
      },
      orderBy: { validFrom: 'desc' },
    });
  }
}
