import { Controller, Get, Query, UseGuards, Inject } from '@nestjs/common';
import { IReportingService } from './interfaces/i-reporting.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSION_CODES } from '@ims/types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '@ims/types';

@Controller('reports')
export class ReportingController {
  constructor(
    @Inject('IReportingService') private readonly reportingService: IReportingService,
    @Inject('IReportingCogsService') private readonly cogsService: import('./interfaces/i-reporting-cogs.service').IReportingCogsService,
  ) {}

  @Get('variance')
  @RequirePermission(PERMISSION_CODES.REPORTING_READ)
  async getVarianceReport(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reportingService.getVarianceReport(
      user.restaurantId,
      limit ? parseInt(limit, 10) : 100,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('snapshots')
  @RequirePermission(PERMISSION_CODES.REPORTING_READ)
  async getSnapshots(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reportingService.getSnapshots(
      user.restaurantId,
      limit ? parseInt(limit, 10) : 100,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('par-alerts')
  @RequirePermission(PERMISSION_CODES.REPORTING_READ)
  async getParAlerts(@CurrentUser() user: JwtPayload) {
    return this.reportingService.getParAlerts(user.restaurantId);
  }

  @Get('cogs')
  @RequirePermission(PERMISSION_CODES.REPORTING_READ)
  async getMenuCostingReport(@CurrentUser() user: JwtPayload) {
    return this.cogsService.getMenuCostingReport(user.restaurantId);
  }
}
