import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/**
 * Actualiza los datos de un empleado. Todos los campos son opcionales: solo se
 * modifica lo que llegue.
 *
 * El documento NO se puede cambiar: identifica a la persona, es la clave con la
 * que se cruzan las cargas de ventas y el nombre de usuario. Corregir un
 * documento equivocado exige crear el empleado de nuevo, para no dejar
 * liquidaciones históricas apuntando a otra persona.
 */
export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsOptional()
  @IsDateString()
  terminationDate?: string;

  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @IsOptional()
  @IsUUID()
  positionId?: string;

  /** false = desactivado: deja de aparecer, pero conserva su histórico. */
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
