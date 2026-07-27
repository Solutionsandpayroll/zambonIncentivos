import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller('home')
export class HomeController {
  constructor(private readonly home: HomeService) {}

  /** Resumen del tablero según rol. Solo requiere estar autenticado. */
  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.home.summary(user);
  }
}
