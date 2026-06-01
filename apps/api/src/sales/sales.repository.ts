import { DB_CLIENT } from '../core/core.symbols';
import { Injectable, Inject } from '@nestjs/common';
import { ISalesRepository } from './interfaces/i-sales.repository';
import { Kysely } from 'kysely';
import { v4 as uuidv4 } from 'uuid';
import { Database, SalesImportBatchId, SalesImportRowId, asRestaurantId, asSalesImportBatchId } from '@ims/types';

@Injectable()
export class SalesRepository implements ISalesRepository {
  constructor(@Inject(DB_CLIENT) private readonly db: Kysely<Database>) {}

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
        file_url: data.fileUrl,
        uploaded_by: data.uploadedBy,
      })
      .returningAll()
      .execute();
      
    return batch;
  }

  async updateBatchStatus(batchId: string, status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED', errorMessage?: string): Promise<void> {
    await this.db
      .updateTable('sales_import_batches')
      .set({ status, error_message: errorMessage || null, updated_at: new Date().toISOString() })
      .where('id', '=', asSalesImportBatchId(batchId))
      .execute();
  }

  async insertImportRows(trx: Kysely<Database>, rows: { batchId: string, rawItemName: string, quantitySold: number, isMapped: boolean, recipeId?: string | null }[]): Promise<void> {
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
          recipe_id: row.recipeId || null,
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

  async getUnmappedRows(
    restaurantId: string,
    batchId: string,
  ): Promise<Array<{ id: string; rawItemName: string; quantitySold: number }>> {
    const rows = await this.db
      .selectFrom('sales_import_rows')
      .innerJoin('sales_import_batches', 'sales_import_batches.id', 'sales_import_rows.batch_id')
      .select(['sales_import_rows.id', 'sales_import_rows.raw_item_name', 'sales_import_rows.quantity_sold'])
      .where('sales_import_rows.batch_id', '=', asSalesImportBatchId(batchId))
      .where('sales_import_rows.is_mapped', '=', false)
      .where('sales_import_batches.restaurant_id', '=', asRestaurantId(restaurantId))
      .execute();

    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      rawItemName: r.raw_item_name as string,
      quantitySold: Number(r.quantity_sold),
    }));
  }
}
