import { DB_CLIENT } from '../core/core.symbols';
import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { randomUUID } from 'crypto';
import {
  Database,
  WasteLog,
  RestaurantId,
  CountRowId,
  WasteLogId,
  asRestaurantId,
  asItemId
} from '@ims/types';
import { CreateWasteLogDto } from '@ims/validators';
import { IWasteRepository } from './interfaces/i-waste.repository';

@Injectable()
export class WasteRepository implements IWasteRepository {
  constructor(@Inject(DB_CLIENT) private readonly db: Kysely<Database>) {}

  private mapWasteLog(row: any): WasteLog {
    return {
      id: row.id as WasteLogId,
      restaurantId: asRestaurantId(row.restaurant_id),
      itemId: asItemId(row.item_id),
      quantity: row.quantity,
      reason: row.reason,
      recordedAt: row.recorded_at
    };
  }

  async createWasteLog(db: any, restaurantId: RestaurantId, dto: CreateWasteLogDto): Promise<WasteLog> {
    const trx = db as Kysely<Database>;
    const id = randomUUID() as WasteLogId;
    
    const row = await trx
      .insertInto('waste_logs')
      .values({
        id,
        restaurant_id: restaurantId,
        item_id: asItemId(dto.itemId),
        quantity: dto.quantity,
        reason: dto.reason || null,
        recorded_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirstOrThrow();
      
    return this.mapWasteLog(row);
  }

  async listWasteLogs(restaurantId: RestaurantId, limit: number = 50, offset: number = 0): Promise<WasteLog[]> {
    const rows = await this.db
      .selectFrom('waste_logs')
      .selectAll()
      .where('restaurant_id', '=', restaurantId)
      .orderBy('recorded_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
      
    return rows.map(r => this.mapWasteLog(r));
  }
}
