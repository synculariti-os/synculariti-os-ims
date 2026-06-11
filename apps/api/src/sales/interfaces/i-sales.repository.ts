import type { PosRawImportInsert } from '@ims/types';

export const SALES_REPOSITORY_TOKEN = Symbol('SALES_REPOSITORY_TOKEN');

export interface ISalesRepository {
  createBatch(data: {
    restaurantId: string;
    businessDate: string;
    fileUrl: string;
    uploadedBy: string;
    storagePath?: string | null;
    originalFileName?: string | null;
    totalRows?: number | null;
  }): Promise<{ id: string; status: string; restaurant_id: string; business_date: string }>;
  findBatchById(batchId: string): Promise<{
    id: string;
    restaurantId: string;
    businessDate: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    storagePath: string | null;
    fileUrl: string | null;
    uploadedBy: string | null;
    originalFileName: string | null;
    totalRows: number | null;
    importedRows: number | null;
    createdAt: string;
    updatedAt: string;
    errorMessage: string | null;
  } | null>;
  updateBatchStatus(batchId: string, status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED', errorMessage?: string): Promise<void>;
  updateBatchAfterUpload(batchId: string, data: { importedRows: number }): Promise<void>;
  insertImportRows(trx: import('kysely').Kysely<import('@ims/types').Database>, rows: { batchId: string, rawItemName: string, quantitySold: number, isMapped: boolean, recipeId?: string | null }[]): Promise<void>;
  insertPosRawImports(trx: import('kysely').Kysely<import('@ims/types').Database>, rows: PosRawImportInsert[]): Promise<void>;
  listBatches(restaurantId: string, page: number, limit: number): Promise<{ data: import('@ims/types').SalesImportBatch[], total: number }>;
  getUnmappedRows(restaurantId: string, batchId: string): Promise<Array<{ id: string; rawItemName: string; quantitySold: number }>>;
}
