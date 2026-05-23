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

  async insertImportRows(trx: any, rows: any[]): Promise<void> {
    if (rows.length === 0) return;
    await trx
      .insertInto('sales_import_rows')
      .values(rows.map(r => ({
        batch_id: r.batchId,
        raw_item_name: r.rawItemName,
        quantity_sold: r.quantitySold,
        is_mapped: r.isMapped
      })))
      .execute();
  }

  async getMenuItemMappings(restaurantId: string, rawExcelStrings: string[]): Promise<{ rawExcelString: string; recipeId: string }[]> {
    if (rawExcelStrings.length === 0) return [];
    
    const mappings = await this.db
      .selectFrom('menu_item_mappings' as any)
      .select(['raw_excel_string' as any, 'recipe_id' as any])
      .where('restaurant_id' as any, '=', restaurantId)
      .where('raw_excel_string' as any, 'in', rawExcelStrings)
      .execute();

    return mappings.map((m: any) => ({
      rawExcelString: m.raw_excel_string,
      recipeId: m.recipe_id
    }));
  }
}
