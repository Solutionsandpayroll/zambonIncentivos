import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SalesImportService } from './sales-import.service';
import { UploadSalesDto } from './dto/upload-sales.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/constants/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller('sales-upload')
export class SalesImportController {
  constructor(private readonly salesImport: SalesImportService) {}

  /**
   * Sube el archivo de ventas (multipart: `file` + `periodId`).
   * Responde 200 con el resumen (síncrono). El diseño prevé pasar a 202 + cola
   * para archivos grandes (diseno §12).
   */
  @Post()
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query() dto: UploadSalesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('Falta el archivo (campo `file`)');
    return this.salesImport.import(
      file.buffer,
      file.originalname,
      dto.periodId,
      user.userId,
    );
  }

  @Get('batches')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  listBatches(@Query('periodId') periodId?: string) {
    return this.salesImport.listBatches(periodId);
  }

  @Get('batches/:id')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  getBatch(@Param('id') id: string) {
    return this.salesImport.getBatch(id);
  }
}
