import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';

/**
 * Orígenes autorizados para CORS, leídos de CORS_ORIGINS (separados por coma).
 *
 * Vacío = CORS desactivado, que es lo correcto mientras el backend sirva también
 * el frontend (mismo origen, ver ServeStaticModule). Solo hace falta declarar
 * orígenes si el frontend pasa a alojarse en otro dominio.
 */
function resolveCorsOrigins(): string[] {
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (origins.includes('*')) {
    throw new Error(
      "[cors] CORS_ORIGINS no admite '*': expondría la API a cualquier sitio web. " +
        'Declara los dominios exactos, separados por coma.',
    );
  }

  return origins;
}

async function bootstrap() {
  const corsOrigins = resolveCorsOrigins();

  // CORS se pasa aquí (no con app.enableCors() más abajo): debe quedar registrado
  // antes que el resto de middlewares para que aplique a todas las rutas.
  const app = await NestFactory.create(AppModule, {
    bufferLogs: false,
    cors:
      corsOrigins.length > 0
        ? {
            origin: corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
          }
        : false,
  });

  // Prefijo global: todos los endpoints cuelgan de /api/v1 (contrato API.md).
  // La raíz '/' se excluye para poder redirigir al login del frontend.
  app.setGlobalPrefix('api/v1', { exclude: ['/'] });

  // Validación automática de DTOs (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Errores en forma estándar { statusCode, message, error, correlationId }
  app.useGlobalInterceptors(new CorrelationIdInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  if (corsOrigins.length > 0) {
    Logger.log(`CORS habilitado para: ${corsOrigins.join(', ')}`, 'Bootstrap');
  }

  const port = process.env.PORT ?? 3000;

  // Se escucha en 0.0.0.0, no en localhost. Nest hace bind solo a la interfaz
  // local por defecto, y en un hosting con contenedores (Render, Fly, Railway)
  // el enrutador vive FUERA del contenedor: no alcanzaría el puerto y el
  // despliegue moriría por timeout aunque el proceso esté arriba y sano.
  await app.listen(port, '0.0.0.0');
  Logger.log(`Zambon backend escuchando en el puerto ${port} (/api/v1)`, 'Bootstrap');
}

bootstrap();
