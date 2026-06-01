import { Controller, Get, Query, Inject } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSION_CODES, JwtPayload } from '@ims/types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { vendorPriceHistoryQuerySchema } from '@ims/validators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

import { IReportingService, REPORTING_SERVICE_TOKEN } from './interfaces/i-reporting.service';
import { IReportingCogsService, REPORTING_COGS_SERVICE_TOKEN } from './interfaces/i-reporting-cogs.service';

@Controller('reports')
export class ReportingController {
  constructor(
    @Inject(REPORTING_SERVICE_TOKEN) private readonly reportingService: IReportingService,
    @Inject(REPORTING_COGS_SERVICE_TOKEN) private readonly cogsService: IReportingCogsService,
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

  @Get('vendor-pricing')
  @RequirePermission(PERMISSION_CODES.REPORTING_READ)
  async getVendorPriceHistory(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(vendorPriceHistoryQuerySchema)) query: { itemId: string },
  ) {
    return this.cogsService.getVendorPriceHistory(user.restaurantId, query.itemId);
  }
}
