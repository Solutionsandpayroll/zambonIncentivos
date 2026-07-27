import { IsUUID } from 'class-validator';

export class UploadSalesDto {
  @IsUUID()
  periodId!: string;
}
