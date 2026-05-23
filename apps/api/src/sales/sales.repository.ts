import { Injectable, Inject } from '@nestjs/common';
import { ISalesRepository } from './interfaces/i-sales.repository';
import { Kysely } from 'kysely';
import { Database } from '@ims/types';

@Injectable()
export class SalesRepository implements ISalesRepository {
  constructor(@Inject('DB_CLIENT') private readonly db: Kysely<Database>) {}

  async createBatch(data: {
    restaurantId: string;
    businessDate: string;
    fileUrl: string;
    uploadedBy: string;
  }): Promise<any> {
    const [batch] = await this.db
      .insertInto('sales_import_batches')
      .values({
        restaurant_id: data.restaurantId,
        business_date: data.businessDate,
        status: 'PENDING',
      })
      .returningAll()
      .execute();
      
    // Note: Normally we'd store fileUrl, but keeping it simple as schema doesn't have it yet.
    return batch;
  }

  async updateBatchStatus(batchId: string, status: 'PROCESSING' | 'COMPLETED' | 'FAILED', errorMessage?: string): Promise<void> {
    await this.db
      .updateTable('sales_import_batches')
      .set({ status, error_message: errorMessage || null, updated_at: new Date().toISOString() })
      .where('id' as any, '=', batchId)
      .execute();
  }
}
