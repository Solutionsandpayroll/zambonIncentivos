import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserStatus } from '@prisma/client';
import { AppRole } from '../../../common/constants/roles';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserStatus)
  userStatus?: UserStatus;

  /** Si se envía, reemplaza el conjunto de roles del usuario. */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AppRole, { each: true })
  roleNames?: AppRole[];
}
