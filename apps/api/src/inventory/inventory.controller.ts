import { Controller, Get, Query, Inject, UseGuards, UseInterceptors } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { TenantContextInterceptor } from '../common/interceptors/tenant-context.interceptor';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '@ims/types';
import { LEDGER_SERVICE_TOKEN, ILedgerService } from './interfaces/i-ledger.service';

@Controller('inventory')
@UseGuards(SupabaseAuthGuard, PermissionsGuard)
@UseInterceptors(TenantContextInterceptor)
export class InventoryController {
  constructor(
    @Inject(LEDGER_SERVICE_TOKEN) private readonly ledgerService: ILedgerService,
  ) {}

  @Get('stock')
  @RequirePermission('INVENTORY.READ')
  async getStock(@CurrentUser() user: JwtPayload) {
    const data = await this.ledgerService.getCurrentStockBulk(user.restaurantId);
    return { data };
  }

  @Get('ledger')
  @RequirePermission('INVENTORY.READ')
  async getLedger(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string | number,
    @Query('offset') offset?: string | number,
  ) {
    const limitNum = limit ? typeof limit === 'number' ? limit : parseInt(limit as string, 10) : 50;
    const offsetNum = offset ? typeof offset === 'number' ? offset : parseInt(offset as string, 10) : 0;
    const data = await this.ledgerService.getLedgerEntries(user.restaurantId, limitNum, offsetNum);
    return { data, meta: { limit: limitNum, offset: offsetNum } };
  }
}
