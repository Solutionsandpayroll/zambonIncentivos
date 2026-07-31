import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ConditionType } from '@prisma/client';

/**
 * Pago garantizado: fuerza el pago completo del 80% y/o 20% (NEW_HIRE, ZONE_CHANGE).
 *
 * Se aplica a UNA persona (`employeeId`) o a TODO un equipo (`teamId`), que es
 * el caso de un traslado o una apertura que afecta a la brigada completa. Debe
 * venir exactamente uno de los dos; el servicio rechaza ambos o ninguno.
 */
export class CreatePaymentConditionDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsUUID()
  periodId!: string;

  @IsEnum(ConditionType)
  conditionType!: ConditionType;

  @IsOptional()
  @IsBoolean()
  apply80Percent?: boolean;

  @IsOptional()
  @IsBoolean()
  apply20Percent?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
