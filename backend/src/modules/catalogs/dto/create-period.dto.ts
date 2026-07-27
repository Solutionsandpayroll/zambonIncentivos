import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
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

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
