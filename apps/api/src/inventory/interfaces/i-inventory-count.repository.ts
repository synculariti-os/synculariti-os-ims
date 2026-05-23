import type {
  InventoryCountBatch,
  InventoryCountRow,
  CountBatchId,
  CountRowId,
  RestaurantId,
} from '@ims/types';

export interface CreateCountRowInput {
  item_id: string;
  expected_qty: number;
}

export interface IInventoryCountRepository {
  createBatch(db: unknown, restaurantId: RestaurantId): Promise<InventoryCountBatch>;
  findBatchById(batchId: CountBatchId): Promise<InventoryCountBatch | null>;
  updateBatchStatus(
    trx: unknown,
    batchId: CountBatchId,
    status: string,
    version: number,
  ): Promise<boolean>; // returns false on optimistic lock failure
  findRowsByBatchId(batchId: CountBatchId): Promise<InventoryCountRow[]>;
  updateCountRow(
    db: unknown,
    rowId: CountRowId,
    actualQty: number,
  ): Promise<InventoryCountRow>;
  createCountRows(
    db: unknown,
    batchId: CountBatchId,
    rows: CreateCountRowInput[],
  ): Promise<void>;
}
