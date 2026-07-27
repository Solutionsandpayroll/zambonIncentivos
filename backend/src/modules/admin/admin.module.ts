import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { IncentivesModule } from '../incentives/incentives.module';

@Module({
  // IncentivesModule exporta IncentivesService, que el reproceso reutiliza.
  // AuditService llega por el AuditModule global (shared/audit).
  imports: [IncentivesModule],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
})
export class AdminModule {}
