import { IsInt, Max, Min } from 'class-validator';

/** Siembra el año completo: 3 ciclos y 12 meses enlazados. */
export class SeedYearDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  periodYear!: number;
}
