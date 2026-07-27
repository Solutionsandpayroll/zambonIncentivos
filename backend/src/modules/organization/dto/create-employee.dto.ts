import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/**
 * Crea persona + empleado en un solo paso (el caso común desde la UI).
 * El documento identifica la persona; el resto son datos laborales.
 */
export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  documentNumber!: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  employeeCode!: string;

  @IsNumber()
  @Min(0)
  baseSalary!: number;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @IsOptional()
  @IsUUID()
  positionId?: string;
}
