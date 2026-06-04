import type { RestaurantId, ItemId, UserId, SalesImportBatchId, SalesImportRowId, SnapshotId, RecipeId } from '../branded';
export type ImportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export interface SalesImportBatch {
  id: SalesImportBatchId;
  restaurantId: RestaurantId;
  businessDate: string;
  status: ImportStatus;
  errorMessage: string | null;
  /** URL to the uploaded file in storage */
  fileUrl: string | null;
  /** User who uploaded the file */
  uploadedBy: UserId | null;
  createdAt: string;
  updatedAt: string;
}
export interface SalesImportRow {
  id: SalesImportRowId;
  batchId: SalesImportBatchId;
  rawItemName: string;
  quantitySold: number;
  isMapped: boolean;
  /** Resolved recipe ID after POS-string mapping, null if unmapped */
  recipeId: RecipeId | null;
  createdAt: string;
}
export interface DailyInventorySnapshot { id: SnapshotId; restaurantId: RestaurantId; itemId: ItemId; businessDate: string; eodQty: number; fifoTotalValue: number; createdAt: string; }

/**
 * Row from `mat_view_variance_analytics`.
 *
 * Note: The materialized view only computes `unexplained_variance_qty`
 * (the sum of COUNT_ADJUSTMENT ledger entries per restaurant/item/month).
 * Theoretical and actual quantities are NOT in the view — they would
 * require BOM expansion which is a separate computation.
 */
export interface VarianceAnalyticRow {
  restaurantId: RestaurantId | null;
  itemId: ItemId | null;
  reportingMonth: string | null;
  unexplainedVarianceQty: number | null;
}
