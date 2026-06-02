import type { LedgerReasonCode, RestaurantId, ItemId, } from '@ims/types';


export interface LedgerEntryDto {
  restaurantId: RestaurantId;
  itemId: ItemId;
  changeAmount: number;
  reasonCode: LedgerReasonCode;
  referenceId?: string | null;
}
