export const SALES_SERVICE_TOKEN = Symbol('SALES_SERVICE_TOKEN');

export interface ISalesService {
  uploadSalesFile(
    file: Express.Multer.File,
    dto: { businessDate: string },
    restaurantId: string,
    franchiseId: string,
    userId: string,
  ): Promise<{ batchId: string }>;
  listBatches(restaurantId: string, page: number, limit: number): Promise<{ data: import('@ims/types').SalesImportBatch[], meta: import('@ims/types').PaginationMeta }>;
  getUnmappedRows(restaurantId: string, batchId: string): Promise<Array<{ id: string; rawItemName: string; quantitySold: number }>>;
}
