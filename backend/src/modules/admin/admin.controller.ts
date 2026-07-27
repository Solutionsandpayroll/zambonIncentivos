import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateNoveltyDto } from './dto/create-novelty.dto';
import { CreatePaymentConditionDto } from './dto/create-payment-condition.dto';
import { ReprocessDto } from './dto/reprocess.dto';
import { AuditQueryDto } from './dto/audit-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/constants/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller()
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ---- Novedades (ADMIN, NOMINA) -----------------------------------------
  @Get('novelties')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  listNovelties(
    @Query('periodId') periodId?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.admin.listNovelties({ periodId, employeeId });
  }

  @Post('novelties')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  createNovelty(
    @Body() dto: CreateNoveltyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.admin.createNovelty(dto, user);
  }

  // ---- Pago garantizado (ADMIN) ------------------------------------------
  @Get('payment-conditions')
  @Roles(AppRole.ADMIN)
  listPaymentConditions(
    @Query('periodId') periodId?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.admin.listPaymentConditions({ periodId, employeeId });
  }

  @Post('payment-conditions')
  @Roles(AppRole.ADMIN)
  createPaymentCondition(
    @Body() dto: CreatePaymentConditionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.admin.createPaymentCondition(dto, user);
  }

  // ---- Reproceso y auditoría (ADMIN) -------------------------------------
  @Post('admin/reprocess')
  @Roles(AppRole.ADMIN)
  reprocess(
    @Body() dto: ReprocessDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.admin.reprocess(dto, user);
  }

  @Get('admin/audit')
  @Roles(AppRole.ADMIN)
  listAudit(@Query() query: AuditQueryDto) {
    return this.admin.listAudit(query);
  }
}
