import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';
import { AppRole } from '../../../common/constants/roles';

export class CreateUserDto {
  /** Empleado al que se vincula el usuario. Nulo para usuarios técnicos. */
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{3,50}$/, {
    message: 'username: 3-50 caracteres alfanuméricos, punto, guion o guion bajo',
  })
  username!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AppRole, { each: true })
  roleNames!: AppRole[];
}
