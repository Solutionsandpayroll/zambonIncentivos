import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/constants/roles';
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

@Controller()
export class OrganizationController {
  constructor(private readonly organization: OrganizationService) {}

  // ---- Empleados ----------------------------------------------------------
  @Get('employees')
  @Roles(AppRole.ADMIN, AppRole.NOMINA, AppRole.GERENTE, AppRole.COORDINADOR)
  listEmployees(
    @CurrentUser() user: AuthenticatedUser,
    @Query('teamId') teamId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('withoutTeam') withoutTeam?: string,
  ) {
    return this.organization.listEmployees(user, {
      teamId,
      zoneId,
      withoutTeam: withoutTeam === 'true',
    });
  }

  @Post('employees')
  @Roles(AppRole.ADMIN)
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.organization.createEmployee(dto);
  }

  /**
   * Edita un empleado y, con `active`, lo activa o desactiva. No existe DELETE:
   * borrar dejaría huérfanas sus liquidaciones (ver updateEmployee).
   */
  @Patch('employees/:id')
  @Roles(AppRole.ADMIN)
  updateEmployee(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.organization.updateEmployee(id, dto);
  }

  // ---- Estructura ---------------------------------------------------------
  //
  // Ninguna entidad se borra: están referenciadas por empleados y por
  // liquidaciones ya calculadas. Los PATCH renombran y activan/desactivan.
  // `?includeInactive=true` las muestra para poder reactivarlas.

  @Get('teams')
  listTeams(@Query('includeInactive') includeInactive?: string) {
    return this.organization.listTeams(includeInactive === 'true');
  }

  @Post('teams')
  @Roles(AppRole.ADMIN)
  createTeam(@Body() dto: CreateTeamDto) {
    return this.organization.createTeam(dto);
  }

  @Patch('teams/:id')
  @Roles(AppRole.ADMIN)
  updateTeam(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.organization.updateTeam(id, dto);
  }

  @Get('positions')
  listPositions(@Query('includeInactive') includeInactive?: string) {
    return this.organization.listPositions(includeInactive === 'true');
  }

  @Post('positions')
  @Roles(AppRole.ADMIN)
  createPosition(@Body() dto: CreatePositionDto) {
    return this.organization.createPosition(dto);
  }

  @Patch('positions/:id')
  @Roles(AppRole.ADMIN)
  updatePosition(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.organization.updatePosition(id, dto);
  }

  @Get('regions')
  listRegions(@Query('includeInactive') includeInactive?: string) {
    return this.organization.listRegions(includeInactive === 'true');
  }

  @Post('regions')
  @Roles(AppRole.ADMIN)
  createRegion(@Body() dto: CreateRegionDto) {
    return this.organization.createRegion(dto);
  }

  @Patch('regions/:id')
  @Roles(AppRole.ADMIN)
  updateRegion(@Param('id') id: string, @Body() dto: UpdateRegionDto) {
    return this.organization.updateRegion(id, dto);
  }

  @Get('zones')
  listZones(
    @Query('regionId') regionId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.organization.listZones(regionId, includeInactive === 'true');
  }

  @Patch('zones/:id')
  @Roles(AppRole.ADMIN)
  updateZone(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.organization.updateZone(id, dto);
  }

  @Post('zones')
  @Roles(AppRole.ADMIN)
  createZone(@Body() dto: CreateZoneDto) {
    return this.organization.createZone(dto);
  }

  // ---- Jerarquía ----------------------------------------------------------
  @Get('hierarchy')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  listHierarchy() {
    return this.organization.listHierarchy();
  }

  @Get('hierarchy/subordinates/:employeeId')
  @Roles(AppRole.ADMIN, AppRole.GERENTE, AppRole.COORDINADOR)
  subordinates(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
  ) {
    return this.organization.subordinates(user, employeeId);
  }

  @Post('hierarchy')
  @Roles(AppRole.ADMIN)
  createHierarchy(@Body() dto: CreateHierarchyDto) {
    return this.organization.createHierarchy(dto);
  }
}
