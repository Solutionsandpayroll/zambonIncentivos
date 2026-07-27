import { Controller, Get, Param, Query } from '@nestjs/common';
import { ResultsService } from './results.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/constants/roles';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller('results')
export class ResultsController {
  constructor(private readonly results: ResultsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('periodId') periodId?: string,
    @Query('teamId') teamId?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.results.list(user, { periodId, teamId, employeeId });
  }

  @Get('employee/:employeeId/period/:periodId')
  byEmployeePeriod(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Param('periodId') periodId: string,
    @Query('version') version?: string,
  ) {
    return this.results.byEmployeePeriod(
      user,
      employeeId,
      periodId,
      version ? Number(version) : undefined,
    );
  }

  @Get(':headerId/versions')
  @Roles(AppRole.ADMIN, AppRole.NOMINA)
  versions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('headerId') headerId: string,
  ) {
    return this.results.versions(user, headerId);
  }

  @Get(':headerId')
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('headerId') headerId: string,
  ) {
    return this.results.detail(user, headerId);
  }
}
