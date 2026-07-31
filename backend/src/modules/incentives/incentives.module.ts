import { Module } from '@nestjs/common';
import { IncentivesController } from './incentives.controller';
import { IncentivesService } from './incentives.service';
import { IncentivesRepository } from './incentives.repository';
import { ExecutionKpiService } from './execution-kpi.service';

// AuditService llega por el AuditModule global (shared/audit).
@Module({
  controllers: [IncentivesController],
  providers: [IncentivesService, IncentivesRepository, ExecutionKpiService],
  exports: [IncentivesService],
})
export class IncentivesModule {}
