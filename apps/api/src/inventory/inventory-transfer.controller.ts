import { Controller, Post, Param, Body, UseGuards, Get, Query } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '@ims/types';
import { InventoryTransferService } from './inventory-transfer.service';
import { CreateTransferDto } from '@ims/validators';

@Controller('inventory/transfers')
@UseGuards(SupabaseAuthGuard)
export class InventoryTransferController {
  constructor(private readonly transferService: InventoryTransferService) {}

  @Post()
  @RequirePermission('INVENTORY.WRITE')
  async createTransfers(@CurrentUser() user: JwtPayload, @Body() dto: CreateTransferDto) {
    return this.transferService.createTransfers(user.restaurantId, user.franchiseGroupId, dto);
  }

  @Post(':id/dispatch')
  @RequirePermission('INVENTORY.WRITE')
  async dispatchTransfer(@CurrentUser() user: JwtPayload, @Param('id') transferId: string) {
    return this.transferService.dispatchTransfer(user.restaurantId, transferId as any);
  }

  @Post(':id/receive')
  @RequirePermission('INVENTORY.WRITE')
  async receiveTransfer(@CurrentUser() user: JwtPayload, @Param('id') transferId: string) {
    return this.transferService.receiveTransfer(user.restaurantId, transferId as any);
  }

  @Post(':id/cancel')
  @RequirePermission('INVENTORY.WRITE')
  async cancelTransfer(@CurrentUser() user: JwtPayload, @Param('id') transferId: string) {
    return this.transferService.cancelTransfer(user.restaurantId, transferId as any);
  }

  @Get()
  @RequirePermission('INVENTORY.READ')
  async listTransfers(
    @CurrentUser() user: JwtPayload,
    @Query('direction') direction: 'IN' | 'OUT' = 'OUT'
  ) {
    return this.transferService.listTransfers(user.restaurantId, direction);
  }
}
