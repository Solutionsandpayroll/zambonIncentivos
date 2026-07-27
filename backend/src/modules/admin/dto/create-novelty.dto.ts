import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/** Novedad operativa: incapacidad, licencia, cambio de zona, etc. */
export class CreateNoveltyDto {
  @IsUUID()
  employeeId!: string;

  @IsUUID()
  periodId!: string;

  @IsString()
  noveltyType!: string; // incapacidad, licencia, cambio_zona...

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  daysAffected?: number;

  @IsOptional()
  @IsString()
  impactType?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
