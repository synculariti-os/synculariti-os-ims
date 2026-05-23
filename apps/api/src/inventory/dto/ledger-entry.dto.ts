import type { LedgerReasonCode, RestaurantId, ItemId, StockLevel } from '@ims/types';
import { LEDGER_REASON_CODES } from '@ims/types';

export interface LedgerEntryDto {
  restaurantId: RestaurantId;
  itemId: ItemId;
  changeAmount: number;
  reasonCode: LedgerReasonCode;
  referenceId?: string | null;
}
