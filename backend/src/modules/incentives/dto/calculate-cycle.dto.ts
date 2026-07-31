import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CalculateCycleDto {
  /** El periodo de tipo CYCLE que se liquida. */
  @IsUUID()
  periodId!: string;

  /**
   * Previsualización: calcula y devuelve el resumen sin persistir nada. El
   * cierre de ciclo mueve el 20% de todo un cuatrimestre, así que hay que poder
   * mirarlo antes de escribirlo.
   */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  dryRun?: boolean;
}
