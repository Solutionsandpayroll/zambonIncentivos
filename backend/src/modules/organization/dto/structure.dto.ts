import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
