import { Global, Module } from '@nestjs/common';
import { PeriodResolverService } from './period-resolver.service';

/**
 * Módulo global: la relación mes ↔ ciclo la consultan incentives, catalogs y
 * sales-import. Global, igual que PrismaModule y AuditModule, para no acoplar
 * esos módulos entre sí.
 */
@Global()
@Module({
  providers: [PeriodResolverService],
  exports: [PeriodResolverService],
})
export class PeriodsModule {}
