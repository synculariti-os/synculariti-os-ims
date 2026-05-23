import type { PurchaseOrder, PurchaseOrderId } from '@ims/types';
import type { CreatePoDto, ReceivePoDto } from '@ims/validators';

export const PROCUREMENT_SERVICE_TOKEN = Symbol('PROCUREMENT_SERVICE_TOKEN');

export interface IProcurementService {
  createDraftPO(dto: CreatePoDto): Promise<PurchaseOrder>;
  submitPO(poId: PurchaseOrderId): Promise<PurchaseOrder>;
  receivePO(poId: PurchaseOrderId, dto: ReceivePoDto): Promise<void>;
  cancelPO(poId: PurchaseOrderId): Promise<void>;
}
