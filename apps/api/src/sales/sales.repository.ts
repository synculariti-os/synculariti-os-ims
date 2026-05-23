import { Injectable, Inject } from '@nestjs/common';
import { ISalesRepository } from './interfaces/i-sales.repository';
import { Kysely } from 'kysely';
import { v4 as uuidv4 } from 'uuid';
import { Database, SalesImportBatchId, SalesImportRowId, asRestaurantId, asSalesImportBatchId } from '@ims/types';

@Injectable()
export class SalesRepository implements ISalesRepository {
  constructor(@Inject('DB_CLIENT') private readonly db: Kysely<Database>) {}

  async createBatch(data: {
    restaurantId: string;
    businessDate: string;
    fileUrl: string;
    uploadedBy: string;
  }): Promise<{ id: string; status: string; restaurant_id: string; business_date: string }> {
    const [batch] = await this.db
      .insertInto('sales_import_batches')
      .values({
        id: uuidv4() as SalesImportBatchId,
        restaurant_id: asRestaurantId(data.restaurantId),
        business_date: data.businessDate,
        status: 'PENDING',
      })
      .returningAll()
      .execute();
      
    // Note: Normally we'd store fileUrl, but keeping it simple as schema doesn't have it yet.
    return batch;
  }

  async updateBatchStatus(batchId: string, status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED', errorMessage?: string): Promise<void> {
    await this.db
      .updateTable('sales_import_batches')
      .set({ status, error_message: errorMessage || null, updated_at: new Date().toISOString() })
      .where('id', '=', asSalesImportBatchId(batchId))
      .execute();
  }

  async insertImportRows(trx: Kysely<Database>, rows: { batchId: string, rawItemName: string, quantitySold: number, isMapped: boolean }[]): Promise<void> {
    if (rows.length === 0) return;
    await trx
      .insertInto('sales_import_rows')
      .values(
        rows.map(row => ({
          id: uuidv4() as SalesImportRowId,
          batch_id: row.batchId as SalesImportBatchId,
          raw_item_name: row.rawItemName,
          quantity_sold: row.quantitySold,
          is_mapped: row.isMapped,
        }))
      )
      .execute();
  }

  async listBatches(restaurantId: string, page: number, limit: number): Promise<{ data: import('@ims/types').SalesImportBatch[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [data, totalResult] = await Promise.all([
      this.db
        .selectFrom('sales_import_batches')
        .selectAll()
        .where('restaurant_id', '=', asRestaurantId(restaurantId))
        .orderBy('created_at', 'desc')
        .offset(offset)
        .limit(limit)
        .execute(),
      this.db
        .selectFrom('sales_import_batches')
        .select(this.db.fn.count<string>('id').as('total'))
        .where('restaurant_id', '=', asRestaurantId(restaurantId))
        .executeTakeFirst()
    ]);

    return {
      data: data.map(row => ({
        id: row.id,
        status: row.status,
        restaurantId: row.restaurant_id,
        businessDate: row.business_date,
        errorMessage: row.error_message,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      total: totalResult?.total ? parseInt(totalResult.total, 10) : 0,
    };
  }
}
