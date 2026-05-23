import type { RestaurantId, ItemId, StockLevel } from '@ims/types';
import type { LedgerEntryDto } from '../dto/ledger-entry.dto';

export interface ILedgerRepository {
  insertEntry(trx: unknown, entry: Record<string, unknown>): Promise<void>;
  sumChangeAmount(restaurantId: RestaurantId, itemId: ItemId): Promise<number>;
  sumChangeAmountBulk(restaurantId: RestaurantId): Promise<StockLevel[]>;
}
