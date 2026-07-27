import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ComponentWeightItem {
  @IsUUID()
  componentId!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  weightPercent!: number;
}

export class SetComponentWeightsDto {
  @IsUUID()
  teamId!: string;

  @IsUUID()
  periodId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ComponentWeightItem)
  weights!: ComponentWeightItem[];
}
