import type { RestaurantId, FranchiseGroupId, ItemId, LedgerEntryId, TransferId, CountBatchId, CountRowId, WasteLogId, PrepLogId } from '../branded';
export type LedgerReasonCode = 'PO_RECEIPT' | 'SALES_DEPLETION' | 'WASTE' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'COUNT_ADJUSTMENT' | 'PREP_PRODUCTION' | 'PREP_CONSUMPTION';
export interface InventoryLedgerEntry { id: LedgerEntryId; restaurantId: RestaurantId; itemId: ItemId; changeAmount: number; reasonCode: LedgerReasonCode; referenceId: string | null; createdAt: string; }
export type TransferStatus = 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
export interface InventoryTransfer { id: TransferId; franchiseGroupId: FranchiseGroupId; originRestaurantId: RestaurantId; destinationRestaurantId: RestaurantId; itemId: ItemId; qty: number; status: TransferStatus; createdAt: string; updatedAt: string; }
export type CountStatus = 'OPEN' | 'SUBMITTED' | 'CLOSED';
export interface InventoryCountBatch { id: CountBatchId; restaurantId: RestaurantId; status: CountStatus; snapshotTimestamp: string; version: number; createdAt: string; updatedAt: string; }
export interface InventoryCountRow { id: CountRowId; batchId: CountBatchId; itemId: ItemId; expectedQty: number; actualQty: number | null; varianceQty: number | null; }
export interface WasteLog { id: WasteLogId; restaurantId: RestaurantId; itemId: ItemId; quantity: number; reason: string | null; recordedAt: string; }
export interface PrepProductionLog { id: PrepLogId; restaurantId: RestaurantId; prepItemId: ItemId; yieldQtyProduced: number; producedAt: string; }

export interface PrepPlanLine {
  itemId: ItemId;
  itemName: string;
  inventoryUom: string;
  requiredQty: number;
  currentStock: number;
  shortageQty: number;
}

export interface PrepPlanResponse {
  prepItemId: ItemId;
  targetYield: number;
  ingredients: PrepPlanLine[];
  isPossible: boolean;
}
