import { IsString, MinLength } from 'class-validator';

/** ADMIN restablece la contraseña de un usuario. */
export class ResetPasswordDto {
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  newPassword!: string;
}

/** El propio usuario cambia su contraseña (exige la actual). */
export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  newPassword!: string;
}
