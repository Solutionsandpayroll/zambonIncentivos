import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/** Un escalón de la curva: a partir de minCompliancePercent se paga payPercent. */
export class CurveStepDto {
  @IsNumber()
  @Min(0)
  minCompliancePercent!: number;

  @IsNumber()
  @Min(0)
  payPercent!: number;

  /** Marca la fila tope (">120%"): por encima no se paga más que este valor. */
  @IsOptional()
  @IsBoolean()
  isCeiling?: boolean;
}

export class SetCurvePayDto {
  @IsUUID()
  periodId!: string;

  /** null/ausente = la curva aplica a todos los componentes. */
  @IsOptional()
  @IsUUID()
  componentId?: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CurveStepDto)
  steps!: CurveStepDto[];
}
