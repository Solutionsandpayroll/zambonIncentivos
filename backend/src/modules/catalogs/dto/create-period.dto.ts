import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PeriodType } from '@prisma/client';

export class CreatePeriodDto {
  @IsInt()
  @Min(2000)
  periodYear!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth!: number;

  @IsOptional()
  @IsEnum(PeriodType)
  periodType?: PeriodType;

  @IsOptional()
  @IsInt()
  @Min(1)
  cycleNumber?: number;

  /** Ciclo al que pertenece este mes. Un CYCLE no lo lleva. */
  @IsOptional()
  @IsUUID()
  parentPeriodId?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
