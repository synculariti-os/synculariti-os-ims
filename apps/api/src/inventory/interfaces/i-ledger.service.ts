import type { RestaurantId, ItemId, StockLevel } from '@ims/types';
import type { LedgerEntryDto } from '../dto/ledger-entry.dto';

export interface ILedgerService {
  record(trx: unknown, entry: LedgerEntryDto): Promise<void>;
  getCurrentStock(restaurantId: RestaurantId, itemId: ItemId): Promise<number>;
  getCurrentStockBulk(restaurantId: RestaurantId): Promise<StockLevel[]>;
}

export const LEDGER_SERVICE_TOKEN = Symbol('ILedgerService');
