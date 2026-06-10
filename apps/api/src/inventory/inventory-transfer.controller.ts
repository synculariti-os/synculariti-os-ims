import { Controller, Post, Param, Body, UseGuards, Get, Query, Inject } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, PERMISSION_CODES } from '@ims/types';
import { IInventoryTransferService, INVENTORY_TRANSFER_SERVICE_TOKEN } from './interfaces/i-inventory-transfer.service';
import { CreateTransferDto } from '@ims/validators';


@Controller('inventory/transfers')
@UseGuards(SupabaseAuthGuard)
export class InventoryTransferController {
  constructor(@Inject(INVENTORY_TRANSFER_SERVICE_TOKEN) private readonly transferService: IInventoryTransferService) {}

  @Post()
  @RequirePermission(PERMISSION_CODES.INVENTORY_WRITE)
  async createTransfers(@CurrentUser() user: JwtPayload, @Body() dto: CreateTransferDto) {
    return this.transferService.createTransfers(user.restaurantId, user.franchiseGroupId, dto);
  }

  @Post(':id/dispatch')
  @RequirePermission(PERMISSION_CODES.INVENTORY_WRITE)
  async dispatchTransfer(@CurrentUser() user: JwtPayload, @Param('id') transferId: string) {
    return this.transferService.dispatchTransfer(user.restaurantId, transferId as import('@ims/types').TransferId);
  }

  @Post(':id/receive')
  @RequirePermission(PERMISSION_CODES.INVENTORY_WRITE)
  async receiveTransfer(@CurrentUser() user: JwtPayload, @Param('id') transferId: string) {
    return this.transferService.receiveTransfer(user.restaurantId, transferId as import('@ims/types').TransferId);
  }

  @Post(':id/cancel')
  @RequirePermission(PERMISSION_CODES.INVENTORY_WRITE)
  async cancelTransfer(@CurrentUser() user: JwtPayload, @Param('id') transferId: string) {
    return this.transferService.cancelTransfer(user.restaurantId, transferId as import('@ims/types').TransferId);
  }

  @Get()
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async listTransfers(
    @CurrentUser() user: JwtPayload,
    @Query('direction') direction: 'IN' | 'OUT' = 'OUT',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? Math.min(parseInt(limit, 10), 200) : 50;
    const data = await this.transferService.listTransfers(user.restaurantId, direction);
    const total = data.length;
    const offset = (pageNum - 1) * limitNum;
    return {
      data: data.slice(offset, offset + limitNum),
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }
}
