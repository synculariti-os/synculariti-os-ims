import type { PurchaseOrder, PurchaseOrderId, Vendor } from '@ims/types';
import type { CreatePoDto, ReceivePoDto } from '@ims/validators';

export const PROCUREMENT_SERVICE_TOKEN = Symbol('PROCUREMENT_SERVICE_TOKEN');

export interface IProcurementService {
  createDraftPO(restaurantId: string, dto: CreatePoDto): Promise<PurchaseOrder>;
  submitPO(poId: PurchaseOrderId): Promise<PurchaseOrder>;
  receivePO(poId: PurchaseOrderId, dto: ReceivePoDto): Promise<void>;
  cancelPO(poId: PurchaseOrderId): Promise<void>;
  listPOs(restaurantId: string, page?: number, limit?: number): Promise<{ data: PurchaseOrder[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  listVendors(restaurantId: string): Promise<Vendor[]>;
}
