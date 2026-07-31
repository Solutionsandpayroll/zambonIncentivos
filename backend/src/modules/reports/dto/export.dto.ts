import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
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
  // Opcional: basta con `periodIds` cuando se exportan varios periodos.
  @IsOptional()
  @IsUUID()
  periodId?: string;

  /**
   * Varios periodos en un mismo archivo. Prevalece sobre `periodId`; el
   * consolidado suma todos y el detalle trae una columna de periodo para no
   * mezclar liquidaciones de meses distintos sin poder distinguirlas.
   */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  periodIds?: string[];

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
