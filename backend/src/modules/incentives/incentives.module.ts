import { Module } from '@nestjs/common';
import { IncentivesController } from './incentives.controller';
import { IncentivesService } from './incentives.service';
import { IncentivesRepository } from './incentives.repository';

@Module({
  controllers: [IncentivesController],
  providers: [IncentivesService, IncentivesRepository],
  exports: [IncentivesService],
})
export class IncentivesModule {}
