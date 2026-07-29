import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  teamCode!: string;

  @IsString()
  @IsNotEmpty()
  teamName!: string;
}

export class CreatePositionDto {
  @IsString()
  @IsNotEmpty()
  positionName!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateRegionDto {
  @IsString()
  @IsNotEmpty()
  regionName!: string;
}

export class CreateZoneDto {
  @IsString()
  @IsNotEmpty()
  zoneName!: string;

  @IsUUID()
  regionId!: string;
}

/**
 * DTOs de actualización. Todos los campos son opcionales: solo se modifica lo
 * que llegue. `active: false` desactiva —el registro sale de los listados pero
 * conserva su historia—; no hay borrado, porque equipos, cargos y zonas están
 * referenciados por empleados y liquidaciones ya calculadas.
 */
export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  teamName?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePositionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  positionName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateRegionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  regionName?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateZoneDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  zoneName?: string;

  @IsOptional()
  @IsUUID()
  regionId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
