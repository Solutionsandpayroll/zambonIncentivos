import { Module } from '@nestjs/common';
import { SalesImportController } from './sales-import.controller';
import { SalesImportService } from './sales-import.service';
import { SalesImportRepository } from './sales-import.repository';

@Module({
  controllers: [SalesImportController],
  providers: [SalesImportService, SalesImportRepository],
  exports: [SalesImportService],
})
export class SalesImportModule {}
