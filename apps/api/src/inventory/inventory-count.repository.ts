import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { randomUUID } from 'crypto';
import {
  Database,
  InventoryCountBatch,
  InventoryCountRow,
  CountBatchId,
  CountRowId,
  RestaurantId,
  asCountBatchId,
  asCountRowId,
  asRestaurantId,
  asItemId
} from '@ims/types';
import { IInventoryCountRepository, CreateCountRowInput } from './interfaces/i-inventory-count.repository';

@Injectable()
export class InventoryCountRepository implements IInventoryCountRepository {
  constructor(@Inject('DB_CLIENT') private readonly db: Kysely<Database>) {}

  private mapBatch(row: any): InventoryCountBatch {
    return {
      id: asCountBatchId(row.id),
      restaurantId: asRestaurantId(row.restaurant_id),
      status: row.status as any,
      snapshotTimestamp: row.snapshot_timestamp,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRow(row: any): InventoryCountRow {
    return {
      id: asCountRowId(row.id),
      batchId: asCountBatchId(row.batch_id),
      itemId: asItemId(row.item_id),
      expectedQty: row.expected_qty,
      actualQty: row.actual_qty
    } as InventoryCountRow;
  }

  async createBatch(db: any, restaurantId: RestaurantId): Promise<InventoryCountBatch> {
    const trx = db as Kysely<Database>;
    const id = asCountBatchId(randomUUID());
    const row = await trx
      .insertInto('inventory_count_batches')
      .values({
        id,
        restaurant_id: restaurantId,
        status: 'OPEN',
        snapshot_timestamp: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirstOrThrow();
      
    return this.mapBatch(row);
  }

  async findBatchById(batchId: CountBatchId): Promise<InventoryCountBatch | null> {
    const row = await this.db
      .selectFrom('inventory_count_batches')
      .selectAll()
      .where('id', '=', batchId)
      .executeTakeFirst();
      
    return row ? this.mapBatch(row) : null;
  }

  async listBatches(restaurantId: RestaurantId, limit: number = 50, offset: number = 0): Promise<InventoryCountBatch[]> {
    const rows = await this.db
      .selectFrom('inventory_count_batches')
      .selectAll()
      .where('restaurant_id', '=', restaurantId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
      
    return rows.map(r => this.mapBatch(r));
  }

  async updateBatchStatus(
    trx: any,
    batchId: CountBatchId,
    status: string,
    version: number,
  ): Promise<boolean> {
    const db = trx as Kysely<Database>;
    const res = await db
      .updateTable('inventory_count_batches')
      .set({ 
        status: status as any, 
        version: version + 1,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', batchId)
      .where('version', '=', version)
      .executeTakeFirst();
      
    return res.numUpdatedRows > 0n;
  }

  async findRowsByBatchId(batchId: CountBatchId): Promise<InventoryCountRow[]> {
    const rows = await this.db
      .selectFrom('inventory_count_rows')
      .selectAll()
      .where('batch_id', '=', batchId)
      .execute();
      
    return rows.map(r => this.mapRow(r));
  }

  async updateCountRow(
    db: any,
    rowId: CountRowId,
    actualQty: number,
  ): Promise<InventoryCountRow> {
    const trx = db as Kysely<Database>;
    const row = await trx
      .updateTable('inventory_count_rows')
      .set({ 
        actual_qty: actualQty
      })
      .where('id', '=', rowId)
      .returningAll()
      .executeTakeFirstOrThrow();
      
    return this.mapRow(row);
  }

  async createCountRows(
    db: any,
    batchId: CountBatchId,
    rows: CreateCountRowInput[],
  ): Promise<void> {
    const trx = db as Kysely<Database>;
    if (rows.length === 0) return;
    
    await trx
      .insertInto('inventory_count_rows')
      .values(rows.map(r => ({
        id: asCountRowId(randomUUID()),
        batch_id: batchId,
        item_id: asItemId(r.item_id),
        expected_qty: r.expected_qty,
        actual_qty: null,
        variance_qty: null
      })))
      .execute();
  }
}
