import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/** Cuota de un empleado en un componente, para un periodo. */
export class TargetItemDto {
  @IsUUID()
  employeeId!: string;

  @IsUUID()
  componentId!: string;

  @IsNumber()
  @Min(0)
  quotaValue!: number;
}

/**
 * Upsert (batch) de cuotas para un periodo. Reemplaza/crea cada cuota por
 * (empleado, componente, periodo). Las cuotas también pueden llegar por el
 * archivo de ventas; este endpoint es la vía manual desde Admin.
 */
export class SetTargetsDto {
  @IsUUID()
  periodId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TargetItemDto)
  targets!: TargetItemDto[];
}
