import type { RestaurantId, ItemId, SalesImportBatchId, SalesImportRowId, SnapshotId } from '../branded';
export type ImportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export interface SalesImportBatch { id: SalesImportBatchId; restaurantId: RestaurantId; businessDate: string; status: ImportStatus; errorMessage: string | null; createdAt: string; updatedAt: string; }
export interface SalesImportRow { id: SalesImportRowId; batchId: SalesImportBatchId; rawItemName: string; quantitySold: number; isMapped: boolean; createdAt: string; }
export interface DailyInventorySnapshot { id: SnapshotId; restaurantId: RestaurantId; itemId: ItemId; businessDate: string; eodQty: number; fifoTotalValue: number; createdAt: string; }
export interface VarianceAnalyticRow { restaurantId: RestaurantId | null; itemId: ItemId | null; reportingMonth: string | null; actualQty: number | null; theoreticalQty: number | null; unexplainedVarianceQty: number | null; }
