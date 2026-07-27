import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IncentivesService } from './incentives.service';
import { CalculateDto } from './dto/calculate.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/constants/roles';

@Controller('incentives')
export class IncentivesController {
  constructor(private readonly incentivesService: IncentivesService) {}

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
}
