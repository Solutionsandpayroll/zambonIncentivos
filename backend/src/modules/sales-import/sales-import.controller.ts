import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { SalesImportService } from './sales-import.service';
import { UploadSalesDto } from './dto/upload-sales.dto';
import { SalesTemplateQueryDto } from './dto/sales-template.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/constants/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller('sales-upload')
export class SalesImportController {
  constructor(private readonly salesImport: SalesImportService) {}

  /**
   * Descarga la plantilla .xlsx de un (periodo, equipo), ya rotulada con los
   * empleados del equipo y sus componentes. Va antes que cualquier ruta con
   * parámetro para que 'template' no se interprete como un id.
   */
  @Get('template')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  async template(
    @Query() dto: SalesTemplateQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const { fileName, buffer } = await this.salesImport.generateTemplate(
      dto.periodId,
      dto.teamId,
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  /**
   * Sube el archivo de ventas (multipart: `file` + `periodId`).
   * Responde 200 con el resumen (síncrono). El diseño prevé pasar a 202 + cola
   * para archivos grandes (diseno §12).
   */
  @Post()
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  // 10 MB: es el máximo que ya anuncia la pantalla de carga, y acota el coste
  // de abrir un .xlsx arbitrario con ExcelJS.
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
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
