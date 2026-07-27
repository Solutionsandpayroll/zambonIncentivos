import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CalculateDto {
  @IsUUID()
  periodId!: string;

  /** null/ausente = todo el periodo; o un subconjunto de empleados. */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  employeeIds?: string[];
}
