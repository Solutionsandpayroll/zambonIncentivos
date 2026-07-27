import { Controller, Get, Redirect } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

/**
 * Raíz del sitio: redirige al login. El resto de pantallas del frontend se
 * sirven como estáticos (ServeStaticModule) por su ruta de carpeta.
 * `@Public` porque la raíz no debe exigir JWT.
 */
@Controller()
export class AppRootController {
  @Public()
  @Get()
  @Redirect('/loginf/code.html', 302)
  root(): void {
    // Redirección declarativa; sin cuerpo.
  }
}