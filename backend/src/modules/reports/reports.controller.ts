import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ExportReportDto } from './dto/export.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/constants/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('employee/:employeeId')
  employeeReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Query('periodId') periodId: string,
  ) {
    return this.reports.employeeReport(user, employeeId, periodId);
  }

  @Get('team/:teamId')
  @Roles(AppRole.ADMIN, AppRole.NOMINA, AppRole.GERENTE, AppRole.COORDINADOR)
  teamReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('teamId') teamId: string,
    @Query('periodId') periodId: string,
  ) {
    return this.reports.teamReport(user, teamId, periodId);
  }

  @Get('consolidated')
  @Roles(AppRole.ADMIN, AppRole.NOMINA, AppRole.GERENTE, AppRole.COORDINADOR)
  consolidated(
    @CurrentUser() user: AuthenticatedUser,
    @Query('periodId') periodId: string,
    @Query('teamId') teamId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('componentId') componentId?: string,
    // Varios periodos separados por coma: 'a,b,c'. Prevalece sobre periodId.
    @Query('periodIds') periodIds?: string,
  ) {
    return this.reports.consolidatedReport(user, {
      periodId,
      periodIds: periodIds
        ? periodIds.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      teamId,
      zoneId,
      componentId,
    });
  }

  /**
   * Exportación. Con el volumen actual (~50 empleados) se genera y devuelve
   * síncrono. El diseño prevé mover a cola (202 + jobId) si crece — ver
   * `GET /reports/export/:jobId`, hoy un punto de extensión.
   */
  @Post('export')
  async export(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ExportReportDto,
    @Res() res: Response,
  ): Promise<void> {
    const { fileName, contentType, buffer } = await this.reports.export(
      user,
      dto,
    );
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }
}
