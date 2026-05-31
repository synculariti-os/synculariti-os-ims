import { Injectable, Inject } from '@nestjs/common';
import type { RestaurantId, ItemId, StockLevel } from '@ims/types';
import type { IStockQueryService } from './interfaces/i-stock-query.service';
import type { ILedgerService } from './interfaces/i-ledger.service';
import { LEDGER_SERVICE_TOKEN } from './interfaces/i-ledger.service';

@Injectable()
export class StockQueryService implements IStockQueryService {
  constructor(
    @Inject(LEDGER_SERVICE_TOKEN) private readonly ledgerService: ILedgerService,
  ) {}

  async getCurrentStock(restaurantId: RestaurantId, itemId: ItemId): Promise<number> {
    return this.ledgerService.getCurrentStock(restaurantId, itemId);
  }

  async getCurrentStockBulk(restaurantId: RestaurantId): Promise<StockLevel[]> {
    return this.ledgerService.getCurrentStockBulk(restaurantId);
  }
}
