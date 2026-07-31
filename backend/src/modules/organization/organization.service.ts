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
  UpdateTeamDto,
  UpdatePositionDto,
  UpdateRegionDto,
  UpdateZoneDto,
} from './dto/structure.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
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
  listEmployees(
    user: AuthenticatedUser,
    filters: { teamId?: string; zoneId?: string; withoutTeam?: boolean },
  ) {
    const allowedIds = this.scope.allowedEmployeeIds(user);

    return this.prisma.employee.findMany({
      where: {
        active: true,
        ...(allowedIds !== null ? { employeeId: { in: allowedIds } } : {}),
        ...(filters.zoneId ? { zoneId: filters.zoneId } : {}),
        // `withoutTeam` aísla a quien no tiene asignación activa: sin equipo no
        // hay pesos, así que esa gente nunca entra a la liquidación y conviene
        // poder verla aparte.
        ...(filters.withoutTeam
          ? { teamAssignments: { none: { active: true } } }
          : filters.teamId
            ? { teamAssignments: { some: { teamId: filters.teamId, active: true } } }
            : {}),
      },
      include: {
        person: true,
        zone: true,
        position: true,
        // El equipo viaja en la respuesta para poder mostrarlo y distinguir a
        // los que no tienen ninguno.
        teamAssignments: {
          where: { active: true },
          orderBy: { validFrom: 'desc' },
          take: 1,
          select: { team: { select: { teamId: true, teamName: true } } },
        },
      },
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

  /**
   * Actualiza datos de un empleado y, opcionalmente, lo activa o desactiva.
   *
   * No hay borrado: un empleado con liquidaciones, cuotas o ventas cargadas no
   * puede eliminarse sin dejar huérfano su histórico de nómina. Desactivar lo
   * saca de los listados y del cálculo, conservando lo ya liquidado.
   */
  async updateEmployee(employeeId: string, dto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { employeeId },
      select: { employeeId: true, personId: true },
    });
    if (!employee) throw new NotFoundException('El empleado no existe');

    if (dto.zoneId) {
      const zone = await this.prisma.zone.findUnique({ where: { zoneId: dto.zoneId } });
      if (!zone) throw new NotFoundException('La zona no existe');
    }
    if (dto.positionId) {
      const position = await this.prisma.position.findUnique({
        where: { positionId: dto.positionId },
      });
      if (!position) throw new NotFoundException('El cargo no existe');
    }

    return this.prisma.$transaction(async (tx) => {
      // Nombre y apellido viven en `person`; el resto en `employee`.
      if (dto.firstName !== undefined || dto.lastName !== undefined) {
        const person = await tx.person.findUniqueOrThrow({
          where: { personId: employee.personId },
          select: { firstName: true, lastName: true },
        });
        const firstName = dto.firstName ?? person.firstName;
        const lastName = dto.lastName ?? person.lastName;
        await tx.person.update({
          where: { personId: employee.personId },
          data: { firstName, lastName, fullName: `${firstName} ${lastName}`.trim() },
        });
      }

      return tx.employee.update({
        where: { employeeId },
        data: {
          ...(dto.baseSalary !== undefined && {
            baseSalary: new Prisma.Decimal(dto.baseSalary),
          }),
          ...(dto.hireDate !== undefined && { hireDate: new Date(dto.hireDate) }),
          ...(dto.terminationDate !== undefined && {
            terminationDate: new Date(dto.terminationDate),
          }),
          ...(dto.zoneId !== undefined && { zoneId: dto.zoneId }),
          ...(dto.positionId !== undefined && { positionId: dto.positionId }),
          ...(dto.active !== undefined && { active: dto.active }),
        },
        include: { person: true, zone: true, position: true },
      });
    });
  }

  // ---- Catálogos de estructura --------------------------------------------
  /** Con includeInactive se ven los desactivados, para poder reactivarlos. */
  listTeams(includeInactive = false) {
    return this.prisma.team.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { teamName: 'asc' },
    });
  }

  createTeam(dto: CreateTeamDto) {
    return this.prisma.team.create({ data: { ...dto } });
  }

  listPositions(includeInactive = false) {
    return this.prisma.position.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { positionName: 'asc' },
    });
  }

  createPosition(dto: CreatePositionDto) {
    return this.prisma.position.create({ data: { ...dto } });
  }

  listRegions(includeInactive = false) {
    return this.prisma.region.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { regionName: 'asc' },
    });
  }

  createRegion(dto: CreateRegionDto) {
    return this.prisma.region.create({ data: { ...dto } });
  }

  /** Zonas (ciudades) para filtros y selects. */
  listZones(regionId?: string, includeInactive = false) {
    return this.prisma.zone.findMany({
      where: {
        ...(includeInactive ? {} : { active: true }),
        ...(regionId ? { regionId } : {}),
      },
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

  // ---- Edición de estructura ----------------------------------------------
  //
  // Ninguna entidad se borra: equipos, cargos y zonas están referenciados por
  // empleados y por liquidaciones ya calculadas. `active: false` los saca de
  // los listados conservando esas referencias intactas.

  async updateTeam(teamId: string, dto: UpdateTeamDto) {
    const team = await this.prisma.team.findUnique({ where: { teamId } });
    if (!team) throw new NotFoundException('El equipo no existe');
    return this.prisma.team.update({ where: { teamId }, data: { ...dto } });
  }

  async updatePosition(positionId: string, dto: UpdatePositionDto) {
    const position = await this.prisma.position.findUnique({ where: { positionId } });
    if (!position) throw new NotFoundException('El cargo no existe');
    return this.prisma.position.update({ where: { positionId }, data: { ...dto } });
  }

  async updateRegion(regionId: string, dto: UpdateRegionDto) {
    const region = await this.prisma.region.findUnique({ where: { regionId } });
    if (!region) throw new NotFoundException('La región no existe');
    return this.prisma.region.update({ where: { regionId }, data: { ...dto } });
  }

  async updateZone(zoneId: string, dto: UpdateZoneDto) {
    const zone = await this.prisma.zone.findUnique({ where: { zoneId } });
    if (!zone) throw new NotFoundException('La zona no existe');

    if (dto.regionId) {
      const region = await this.prisma.region.findUnique({
        where: { regionId: dto.regionId },
      });
      if (!region) throw new NotFoundException('La región no existe');
    }

    return this.prisma.zone.update({
      where: { zoneId },
      data: { ...dto },
      include: { region: true },
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
