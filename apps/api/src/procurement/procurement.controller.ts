import { Controller, Post, Patch, Get, Query, Body, Param, Inject, UseGuards, UseInterceptors } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { TenantContextInterceptor } from '../common/interceptors/tenant-context.interceptor';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtPayload, PurchaseOrderId } from '@ims/types';
import { CreatePoDto, createPoSchema, ReceivePoDto, receivePoSchema } from '@ims/validators';

import { PROCUREMENT_SERVICE_TOKEN } from './interfaces/i-procurement.service';
import type { IProcurementService } from './interfaces/i-procurement.service';

@Controller('procurement/orders')
@UseGuards(SupabaseAuthGuard, PermissionsGuard)
@UseInterceptors(TenantContextInterceptor)
export class ProcurementController {
  constructor(
    @Inject(PROCUREMENT_SERVICE_TOKEN)
    private readonly procurementService: IProcurementService,
  ) {}

  @Post()
  @RequirePermission('PROCUREMENT.WRITE')
  async createDraftPO(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createPoSchema)) dto: CreatePoDto,
  ) {
    return this.procurementService.createDraftPO(user.restaurantId, dto);
  }

  @Get()
  @RequirePermission('PROCUREMENT.READ')
  async listPOs(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 50;
    return this.procurementService.listPOs(user.restaurantId, pageNum, limitNum);
  }

  @Get('vendors')
  @RequirePermission('PROCUREMENT.READ')
  async listVendors(@CurrentUser() user: JwtPayload) {
    const data = await this.procurementService.listVendors(user.restaurantId);
    return { data };
  }

  @Patch(':id/submit')
  @RequirePermission('PROCUREMENT.WRITE')
  async submitPO(
    @Param('id') poId: PurchaseOrderId,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.procurementService.submitPO(poId);
  }

  @Patch(':id/receive')
  @RequirePermission('PROCUREMENT.WRITE')
  async receivePO(
    @Param('id') poId: PurchaseOrderId,
    @Body(new ZodValidationPipe(receivePoSchema)) dto: ReceivePoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.procurementService.receivePO(poId, dto);
  }

  @Patch(':id/cancel')
  @RequirePermission('PROCUREMENT.WRITE')
  async cancelPO(
    @Param('id') poId: PurchaseOrderId,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.procurementService.cancelPO(poId);
  }
}
