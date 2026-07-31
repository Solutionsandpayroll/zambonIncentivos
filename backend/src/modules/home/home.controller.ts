import { Controller, Get, Query } from '@nestjs/common';
import { HomeService } from './home.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/constants/roles';

@Controller('home')
export class HomeController {
  constructor(private readonly home: HomeService) {}

  /** Resumen del tablero según rol. Solo requiere estar autenticado. */
  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.home.summary(user);
  }

  /**
   * Avance de liquidación por equipo de un periodo cualquiera, no solo del
   * activo: el tablero necesita poder mirar periodos anteriores sin recargar
   * todo el resumen.
   */
  @Get('team-progress')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  teamProgress(@Query('periodId') periodId?: string) {
    return this.home.teamProgressFor(periodId);
  }
}
