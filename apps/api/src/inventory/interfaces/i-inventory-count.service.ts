export { INVENTORY_COUNT_SERVICE_TOKEN } from '../../core/core.symbols';
import type { InventoryCountBatch, InventoryCountRow, CountBatchId, CountRowId, RestaurantId } from '@ims/types';
import type { CloseCountBatchDto, SubmitCountRowDto } from '@ims/validators';


export interface IInventoryCountService {
  startBatch(restaurantId: RestaurantId): Promise<InventoryCountBatch>;
  submitActualCount(batchId: CountBatchId, rowId: CountRowId, dto: SubmitCountRowDto): Promise<InventoryCountRow>;
  closeBatch(batchId: CountBatchId, dto: CloseCountBatchDto): Promise<void>;
  listBatches(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<InventoryCountBatch[]>;
  getBatchById(batchId: CountBatchId): Promise<{ batch: InventoryCountBatch; rows: InventoryCountRow[] }>;
}
