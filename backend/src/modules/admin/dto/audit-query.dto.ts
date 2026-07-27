import { IsOptional, IsString, IsUUID } from 'class-validator';

/** Filtros de la bitácora de auditoría. */
export class AuditQueryDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsUUID()
  periodId?: string;
}
