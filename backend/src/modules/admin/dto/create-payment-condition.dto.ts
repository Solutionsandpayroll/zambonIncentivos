import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ConditionType } from '@prisma/client';

/** Pago garantizado: fuerza el pago completo del 80% y/o 20% (NEW_HIRE, ZONE_CHANGE). */
export class CreatePaymentConditionDto {
  @IsUUID()
  employeeId!: string;

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
