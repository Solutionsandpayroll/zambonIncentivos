import { Type } from 'class-transformer';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export enum ReportType {
  EMPLOYEE = 'EMPLOYEE',
  TEAM = 'TEAM',
  CONSOLIDATED = 'CONSOLIDATED',
}

export enum ExportFormat {
  XLSX = 'XLSX',
  PDF = 'PDF',
}

export class ExportFiltersDto {
  @IsUUID()
  periodId!: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

export class ExportReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @IsObject()
  @ValidateNested()
  @Type(() => ExportFiltersDto)
  filters!: ExportFiltersDto;
}
