import type { FranchiseGroupId, RestaurantId, ItemId, VendorId, PurchaseOrderId, PoLineItemId, InventoryBatchId } from '../branded';
export type PurchaseOrderStatus = 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'CANCELLED';
export interface Vendor { id: VendorId; franchiseGroupId: FranchiseGroupId | null; restaurantId: RestaurantId | null; name: string; contactEmail: string | null; isActive: boolean; createdAt: string; updatedAt: string; }
export interface PurchaseOrder { id: PurchaseOrderId; restaurantId: RestaurantId; vendorId: VendorId; status: PurchaseOrderStatus; orderDate: string; expectedDeliveryDate: string | null; freightCharge: number; taxAmount: number; discountAmount: number; createdAt: string; updatedAt: string; }
export interface PoLineItem { id: PoLineItemId; poId: PurchaseOrderId; itemId: ItemId; quantityOrdered: number; quantityReceived: number; rawUnitPrice: number; createdAt: string; }
export interface InventoryBatch { id: InventoryBatchId; restaurantId: RestaurantId; itemId: ItemId; poId: PurchaseOrderId | null; receivedDate: string; initialQty: number; remainingQty: number; landedUnitCost: number; createdAt: string; updatedAt: string; }
