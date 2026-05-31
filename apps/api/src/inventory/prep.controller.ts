import { Controller, Post, Get, Body, Query, Inject, UseGuards, UseInterceptors } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantContextInterceptor } from '../common/interceptors/tenant-context.interceptor';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, PrepProductionLog } from '@ims/types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreatePrepLogDto, createPrepLogSchema } from '@ims/validators';
import { IPrepService, PREP_SERVICE_TOKEN } from './interfaces/i-prep.service';

@Controller('inventory/prep')
@UseGuards(SupabaseAuthGuard, PermissionsGuard)
@UseInterceptors(TenantContextInterceptor)
export class PrepController {
  constructor(
    @Inject(PREP_SERVICE_TOKEN) private readonly prepService: IPrepService,
  ) {}

  @Post()
  @RequirePermission('INVENTORY.WRITE')
  async logPrepProduction(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createPrepLogSchema)) dto: CreatePrepLogDto,
  ): Promise<PrepProductionLog> {
    return this.prepService.logPrepProduction(user.restaurantId, dto);
  }

  @Get()
  @RequirePermission('INVENTORY.READ')
  async listPrepLogs(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ data: PrepProductionLog[] }> {
    const data = await this.prepService.listPrepLogs(
      user.restaurantId,
      limit ? parseInt(limit as any, 10) : undefined,
      offset ? parseInt(offset as any, 10) : undefined
    );
    return { data };
  }
}
