import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
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
