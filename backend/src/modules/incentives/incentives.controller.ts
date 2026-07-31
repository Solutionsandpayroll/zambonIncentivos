import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { IncentivesService } from './incentives.service';
import { ExecutionKpiService } from './execution-kpi.service';
import { CalculateDto } from './dto/calculate.dto';
import { CalculateCycleDto } from './dto/calculate-cycle.dto';
import {
  ListExecutionKpiDto,
  SaveExecutionKpiDto,
} from './dto/execution-kpi.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/constants/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller('incentives')
export class IncentivesController {
  constructor(
    private readonly incentivesService: IncentivesService,
    private readonly executionKpi: ExecutionKpiService,
  ) {}

  /**
   * Empleados que vinieron en las ventas del periodo (o de un lote), con su
   * marca de cumplimiento del 20%. Alimenta el paso previo al cálculo.
   */
  @Get('execution-kpi')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  listExecutionKpi(@Query() dto: ListExecutionKpiDto) {
    return this.executionKpi.list(dto.periodId, dto.batchId);
  }

  /** Guarda en bloque el cumplimiento del 20% (mismo patrón que PUT /targets). */
  @Put('execution-kpi')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  saveExecutionKpi(
    @Body() dto: SaveExecutionKpiDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.executionKpi.save(dto, user);
  }

  /**
   * Ejecuta el cálculo del periodo. Genera una nueva versión (no sobrescribe).
   * Hoy responde 200 con el resumen (síncrono); al mover a cola pasará a 202.
   */
  @Post('calculate')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  @HttpCode(HttpStatus.OK)
  calculate(@Body() dto: CalculateDto) {
    return this.incentivesService.calculate(dto);
  }

  /**
   * Liquida el 20% devengado de un ciclo: una bolsa por cada mes cumplido.
   * Con `dryRun` devuelve el resumen sin escribir nada.
   */
  @Post('calculate-cycle')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  @HttpCode(HttpStatus.OK)
  calculateCycle(@Body() dto: CalculateCycleDto) {
    return this.incentivesService.calculateCycle(dto);
  }
}
