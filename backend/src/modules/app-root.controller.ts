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

  /**
   * Sonda de vida para el hosting (Render la consulta tras cada despliegue).
   *
   * A propósito NO toca la base de datos: si Supabase se cae un momento, el
   * hosting reiniciaría el servicio en bucle en vez de servir las pantallas.
   * Esto responde "el proceso está arriba", que es lo que la sonda pregunta.
   */
  @Public()
  @Get('health')
  health(): { status: string; uptime: number } {
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }
}