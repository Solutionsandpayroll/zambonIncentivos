import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

/** Relanza el cálculo de un periodo → nueva versión (no sobrescribe). */
export class ReprocessDto {
  @IsUUID()
  periodId!: string;

  /** Motivo del reproceso (queda en auditoría). */
  @IsString()
  reason!: string;

  /** null/ausente = todo el periodo; o un subconjunto de empleados. */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  employeeIds?: string[];
}
