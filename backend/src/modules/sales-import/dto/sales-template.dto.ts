import { IsUUID } from 'class-validator';

/**
 * Parámetros de la plantilla de ventas. Los dos son obligatorios: el periodo
 * fija la fecha que va en cada fila y el equipo decide qué componentes y qué
 * empleados se precargan.
 */
export class SalesTemplateQueryDto {
  @IsUUID()
  periodId!: string;

  @IsUUID()
  teamId!: string;
}
