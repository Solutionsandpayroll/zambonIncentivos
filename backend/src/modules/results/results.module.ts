import { Module } from '@nestjs/common';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { AccrualService } from './accrual.service';

@Module({
  controllers: [ResultsController],
  providers: [ResultsService, AccrualService],
  exports: [ResultsService],
})
export class ResultsModule {}
