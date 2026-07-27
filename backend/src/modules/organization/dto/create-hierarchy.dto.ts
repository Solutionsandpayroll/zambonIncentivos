import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** Relación jefe–subordinado versionada por fechas (org_hierarchy). */
export class CreateHierarchyDto {
  @IsUUID()
  managerEmployeeId!: string;

  @IsUUID()
  subordinateEmployeeId!: string;

  @IsDateString()
  validFrom!: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;
}
