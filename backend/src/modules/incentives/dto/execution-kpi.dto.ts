import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Filtro de la lista de cumplimiento del 20%. */
export class ListExecutionKpiDto {
  @IsUUID()
  periodId!: string;

  /** Acota a los empleados que vinieron en un lote concreto. */
  @IsOptional()
  @IsUUID()
  batchId?: string;
}

export class ExecutionKpiItemDto {
  @IsUUID()
  employeeId!: string;

  @IsBoolean()
  meetsKpi!: boolean;

  /**
   * Con cuántos KPIs se mide el 20% de este empleado en este mes: 1 (normal) o
   * 2. Con 2, cumplir uno solo gana la mitad de la bolsa del mes.
   */
  @IsOptional()
  @IsInt()
  @IsIn([1, 2])
  kpiCount?: number;

  /** Segundo KPI. Solo se tiene en cuenta si `kpiCount` es 2. */
  @IsOptional()
  @IsBoolean()
  meetsKpi2?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class SaveExecutionKpiDto {
  @IsUUID()
  periodId!: string;

  @IsArray()
  @ArrayMaxSize(2000)
  @ValidateNested({ each: true })
  @Type(() => ExecutionKpiItemDto)
  items!: ExecutionKpiItemDto[];
}
