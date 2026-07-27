import { Global, Module } from '@nestjs/common';
import { ScopeService } from './scope/scope.service';

/**
 * Servicios transversales reutilizables por los módulos de dominio.
 * Global: no hace falta re-importarlo.
 */
@Global()
@Module({
  providers: [ScopeService],
  exports: [ScopeService],
})
export class CommonModule {}
