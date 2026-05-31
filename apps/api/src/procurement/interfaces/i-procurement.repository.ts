import type {
  PurchaseOrder,
  PoLineItem,
  InventoryBatch,
  PurchaseOrderId,
  RestaurantId,
} from '@ims/types';
import type { CreatePoDto } from '@ims/validators';

export interface CreateInventoryBatchInput {
  restaurant_id: RestaurantId;
  item_id: string;
  po_id: PurchaseOrderId;
  initial_qty: number;
  remaining_qty: number;
  landed_unit_cost: number;
}

export interface IProcurementRepository {
  createPO(restaurantId: RestaurantId, dto: CreatePoDto): Promise<PurchaseOrder>;
  findPOById(poId: PurchaseOrderId): Promise<PurchaseOrder | null>;
  listPOs(restaurantId: RestaurantId, limit?: number, offset?: number): Promise<PurchaseOrder[]>;
  updatePOStatus(poId: PurchaseOrderId, status: string): Promise<PurchaseOrder>;
  findLineItemsByPOId(poId: PurchaseOrderId): Promise<PoLineItem[]>;
  updateLineItemReceived(trx: unknown, lineItemId: string, qty: number): Promise<void>;
  createInventoryBatch(trx: unknown, input: CreateInventoryBatchInput): Promise<InventoryBatch>;
}
