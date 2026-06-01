export const SALES_REPOSITORY_TOKEN = Symbol('SALES_REPOSITORY_TOKEN');

export interface ISalesRepository {
  createBatch(data: {
    restaurantId: string;
    businessDate: string;
    fileUrl: string;
    uploadedBy: string;
  }): Promise<{ id: string; status: string; restaurant_id: string; business_date: string }>;
  updateBatchStatus(batchId: string, status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED', errorMessage?: string): Promise<void>;
  insertImportRows(trx: import('kysely').Kysely<import('@ims/types').Database>, rows: { batchId: string, rawItemName: string, quantitySold: number, isMapped: boolean, recipeId?: string | null }[]): Promise<void>;
  listBatches(restaurantId: string, page: number, limit: number): Promise<{ data: import('@ims/types').SalesImportBatch[], total: number }>;
  getUnmappedRows(restaurantId: string, batchId: string): Promise<Array<{ id: string; rawItemName: string; quantitySold: number }>>;
}
