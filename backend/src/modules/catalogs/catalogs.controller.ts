import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CatalogsService } from './catalogs.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { SeedYearDto } from './dto/seed-year.dto';
import { CreateComponentDto } from './dto/create-component.dto';
import { SetComponentWeightsDto } from './dto/component-weights.dto';
import { SetCurvePayDto } from './dto/curve-pay.dto';
import { SetTargetsDto } from './dto/targets.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/constants/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller()
export class CatalogsController {
  constructor(private readonly catalogs: CatalogsService) {}

  // Periodos
  @Get('periods')
  listPeriods() {
    return this.catalogs.listPeriods();
  }

  @Post('periods')
  @Roles(AppRole.ADMIN)
  createPeriod(@Body() dto: CreatePeriodDto) {
    return this.catalogs.createPeriod(dto);
  }

  /**
   * Crea el año completo (3 ciclos + 12 meses enlazados). Idempotente: se puede
   * correr sobre un año que ya tenga periodos sueltos y solo añade lo que falta.
   */
  @Post('periods/seed-year')
  @Roles(AppRole.ADMIN)
  seedYear(@Body() dto: SeedYearDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogs.seedYear(dto.periodYear, user);
  }

  @Patch('periods/:id/close')
  @Roles(AppRole.ADMIN)
  closePeriod(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalogs.closePeriod(id, user);
  }

  // Componentes
  @Get('components')
  listComponents() {
    return this.catalogs.listComponents();
  }

  @Post('components')
  @Roles(AppRole.ADMIN)
  createComponent(@Body() dto: CreateComponentDto) {
    return this.catalogs.createComponent(dto);
  }

  // Pesos de componentes
  @Get('component-weights')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  getWeights(
    @Query('periodId') periodId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.catalogs.getComponentWeights(teamId, periodId);
  }

  @Put('component-weights')
  @Roles(AppRole.ADMIN)
  setWeights(@Body() dto: SetComponentWeightsDto) {
    return this.catalogs.setComponentWeights(dto);
  }

  // Curva de pago
  @Get('curve-pay')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  getCurvePay(
    @Query('periodId') periodId: string,
    @Query('componentId') componentId?: string,
  ) {
    return this.catalogs.getCurvePay(periodId, componentId);
  }

  @Put('curve-pay')
  @Roles(AppRole.ADMIN)
  setCurvePay(@Body() dto: SetCurvePayDto) {
    return this.catalogs.setCurvePay(dto);
  }

  // Cuotas (targets)
  @Get('targets')
  @Roles(AppRole.ADMIN, AppRole.NOMINA, AppRole.COORDINADOR)
  getTargets(
    @Query('periodId') periodId: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.catalogs.getTargets(periodId, employeeId);
  }

  @Put('targets')
  @Roles(AppRole.ADMIN)
  setTargets(@Body() dto: SetTargetsDto) {
    return this.catalogs.setTargets(dto);
  }
}
