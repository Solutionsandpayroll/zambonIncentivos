import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * Auditoría administrativa como servicio compartido y global: lo consumen tanto
 * `admin` (novedades, pago garantizado, reprocesos) como `catalogs` (cierre de
 * periodo) sin acoplar esos módulos entre sí.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
