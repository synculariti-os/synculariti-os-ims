import { Controller, Post, Get, Body, Query, Inject, UseGuards, UseInterceptors } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantContextInterceptor } from '../common/interceptors/tenant-context.interceptor';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, WasteLog } from '@ims/types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateWasteLogDto, createWasteLogSchema } from '@ims/validators';
import { IWasteService, WASTE_SERVICE_TOKEN } from './interfaces/i-waste.service';

@Controller('inventory/waste')
@UseGuards(SupabaseAuthGuard, PermissionsGuard)
@UseInterceptors(TenantContextInterceptor)
export class WasteController {
  constructor(
    @Inject(WASTE_SERVICE_TOKEN) private readonly wasteService: IWasteService,
  ) {}

  @Post()
  @RequirePermission('INVENTORY.WRITE')
  async logWaste(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createWasteLogSchema)) dto: CreateWasteLogDto,
  ): Promise<WasteLog> {
    return this.wasteService.logWaste(user.restaurantId, dto);
  }

  @Get()
  @RequirePermission('INVENTORY.READ')
  async listWasteLogs(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string | number,
    @Query('offset') offset?: string | number,
  ): Promise<{ data: WasteLog[]; meta: { limit: number; offset: number } }> {
    const limitNum = limit ? typeof limit === 'number' ? limit : parseInt(limit as string, 10) : 50;
    const offsetNum = offset ? typeof offset === 'number' ? offset : parseInt(offset as string, 10) : 0;
    const data = await this.wasteService.listWasteLogs(user.restaurantId, limitNum, offsetNum);
    return { data, meta: { limit: limitNum, offset: offsetNum } };
  }
}
