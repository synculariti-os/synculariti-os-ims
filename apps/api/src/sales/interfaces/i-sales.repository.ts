export const SALES_REPOSITORY_TOKEN = Symbol('SALES_REPOSITORY_TOKEN');

export interface ISalesRepository {
  createBatch(data: {
    restaurantId: string;
    businessDate: string;
    fileUrl: string;
    uploadedBy: string;
  }): Promise<any>;
  updateBatchStatus(batchId: string, status: 'PROCESSING' | 'COMPLETED' | 'FAILED', errorMessage?: string): Promise<void>;
  insertImportRows(trx: any, rows: any[]): Promise<void>;
  getMenuItemMappings(restaurantId: string, rawExcelStrings: string[]): Promise<{ rawExcelString: string; recipeId: string }[]>;
}
