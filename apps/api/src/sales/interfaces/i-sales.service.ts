export const SALES_SERVICE_TOKEN = Symbol('SALES_SERVICE_TOKEN');

export interface ISalesService {
  uploadSalesFile(
    file: Express.Multer.File,
    dto: { businessDate: string },
    restaurantId: string,
    franchiseId: string,
    userId: string,
  ): Promise<{ batchId: string }>;
}
