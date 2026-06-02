import { Controller, Post, Patch, Get, Query, Body, Param, Inject, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantContextInterceptor } from '../common/interceptors/tenant-context.interceptor';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { setAuditBeforeState } from '../common/utils/audit.utils';

import { INVENTORY_COUNT_SERVICE_TOKEN } from './interfaces/i-inventory-count.service';
import type { IInventoryCountService } from './interfaces/i-inventory-count.service';
import type { JwtPayload, CountBatchId, CountRowId } from '@ims/types';
import { submitCountRowSchema, closeCountBatchSchema } from '@ims/validators';
import type { SubmitCountRowDto, CloseCountBatchDto } from '@ims/validators';

@Controller('inventory/counts')
@UseGuards(SupabaseAuthGuard, PermissionsGuard)
@UseInterceptors(TenantContextInterceptor)
export class InventoryCountController {
  constructor(
    @Inject(INVENTORY_COUNT_SERVICE_TOKEN)
    private readonly countService: IInventoryCountService,
  ) {}

  @Get()
  @RequirePermission('INVENTORY.READ')
  async listBatches(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const limitNum = limit ? Number(limit) : 50;
    const offsetNum = offset ? Number(offset) : 0;
    const data = await this.countService.listBatches(user.restaurantId, limitNum, offsetNum);
    return { data };
  }

  @Get(':id')
  @RequirePermission('INVENTORY.READ')
  async getBatchById(
    @Param('id') id: string,
  ) {
    const batchId = id as CountBatchId;
    const data = await this.countService.getBatchById(batchId);
    return data;
  }

  @Post('start')
  @RequirePermission('INVENTORY.WRITE')
  async startBatch(@CurrentUser() user: JwtPayload) {
    return this.countService.startBatch(user.restaurantId);
  }

  @Patch(':batchId/rows/:rowId')
  @RequirePermission('INVENTORY.WRITE')
  async submitActualCount(
    @Req() req: Request,
    @Param('batchId') batchId: string,
    @Param('rowId') rowId: string,
    @Body(new ZodValidationPipe(submitCountRowSchema)) dto: SubmitCountRowDto,
  ) {
    const existing = await this.countService.getBatchById(batchId as CountBatchId);
    const row = existing?.rows?.find((r: any) => r.id === rowId);
    if (row) {
      setAuditBeforeState(req, { actualQty: row.actualQty });
    }

    return this.countService.submitActualCount(
      batchId as CountBatchId,
      rowId as CountRowId,
      dto,
    );
  }

  @Post(':batchId/close')
  @RequirePermission('INVENTORY.WRITE')
  async closeBatch(
    @Param('batchId') batchId: string,
    @Body(new ZodValidationPipe(closeCountBatchSchema)) dto: CloseCountBatchDto,
  ) {
    await this.countService.closeBatch(batchId as CountBatchId, dto);
    return { success: true };
  }
}
