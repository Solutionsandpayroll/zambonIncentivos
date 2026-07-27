import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { XlsxExporter } from './exporters/xlsx.exporter';
import { PdfExporter } from './exporters/pdf.exporter';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository, XlsxExporter, PdfExporter],
  exports: [ReportsService],
})
export class ReportsModule {}
