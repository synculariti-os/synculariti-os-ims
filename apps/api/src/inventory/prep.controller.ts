import { Controller, Post, Get, Body, Query, Inject, UseGuards, UseInterceptors } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantContextInterceptor } from '../common/interceptors/tenant-context.interceptor';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, PERMISSION_CODES, PrepProductionLog, PrepPlanResponse } from '@ims/types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreatePrepLogDto, createPrepLogSchema, PlanPrepDto, planPrepSchema } from '@ims/validators';
import { IPrepService, PREP_SERVICE_TOKEN } from './interfaces/i-prep.service';

@Controller('inventory/prep')
@UseGuards(SupabaseAuthGuard, PermissionsGuard)
@UseInterceptors(TenantContextInterceptor)
export class PrepController {
  constructor(
    @Inject(PREP_SERVICE_TOKEN) private readonly prepService: IPrepService,
  ) {}

  @Post()
  @RequirePermission(PERMISSION_CODES.INVENTORY_WRITE)
  async logPrepProduction(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createPrepLogSchema)) dto: CreatePrepLogDto,
  ): Promise<PrepProductionLog> {
    return this.prepService.logPrepProduction(user.restaurantId, dto);
  }

  @Get('plan')
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async planPrepProduction(
    @CurrentUser() user: JwtPayload,
    @Query('itemId') itemId: string,
    @Query('targetYield') targetYield: string,
  ): Promise<PrepPlanResponse> {
    const dto: PlanPrepDto = {
      itemId,
      targetYield: parseFloat(targetYield),
    };
    
    // Validate manually or rely on service. We can parse it with zod here.
    const validDto = planPrepSchema.parse(dto);

    return this.prepService.planPrepProduction(user.restaurantId, validDto);
  }

  @Get()
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async listPrepLogs(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string | number,
    @Query('offset') offset?: string | number,
  ): Promise<{ data: PrepProductionLog[]; meta: { limit: number; offset: number } }> {
    const limitNum = limit ? typeof limit === 'number' ? limit : parseInt(limit as string, 10) : 50;
    const offsetNum = offset ? typeof offset === 'number' ? offset : parseInt(offset as string, 10) : 0;
    const data = await this.prepService.listPrepLogs(user.restaurantId, limitNum, offsetNum);
    return { data, meta: { limit: limitNum, offset: offsetNum } };
  }
}
