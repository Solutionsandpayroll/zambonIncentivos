import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ComponentType } from '@prisma/client';

export class CreateComponentDto {
  @IsString()
  @IsNotEmpty()
  componentCode!: string;

  @IsString()
  @IsNotEmpty()
  componentName!: string;

  @IsEnum(ComponentType)
  componentType!: ComponentType;
}
