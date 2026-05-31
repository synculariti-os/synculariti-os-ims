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
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ data: WasteLog[] }> {
    const data = await this.wasteService.listWasteLogs(
      user.restaurantId,
      limit ? parseInt(limit as any, 10) : undefined,
      offset ? parseInt(offset as any, 10) : undefined
    );
    return { data };
  }
}
