import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { randomUUID } from 'crypto';
import {
  Database,
  PrepProductionLog,
  RestaurantId,
  asPrepLogId,
  asRestaurantId,
  asItemId
} from '@ims/types';
import { CreatePrepLogDto } from '@ims/validators';
import { IPrepRepository } from './interfaces/i-prep.repository';

@Injectable()
export class PrepRepository implements IPrepRepository {
  constructor(@Inject('DB_CLIENT') private readonly db: Kysely<Database>) {}

  private mapPrepLog(row: any): PrepProductionLog {
    return {
      id: asPrepLogId(row.id),
      restaurantId: asRestaurantId(row.restaurant_id),
      prepItemId: asItemId(row.prep_item_id),
      yieldQtyProduced: row.yield_qty_produced,
      producedAt: row.produced_at
    };
  }

  async createPrepLog(db: any, restaurantId: RestaurantId, dto: CreatePrepLogDto): Promise<PrepProductionLog> {
    const trx = db as Kysely<Database>;
    const id = asPrepLogId(randomUUID());
    
    const row = await trx
      .insertInto('prep_production_logs')
      .values({
        id,
        restaurant_id: restaurantId,
        prep_item_id: asItemId(dto.prepItemId),
        yield_qty_produced: dto.yieldQtyProduced,
        produced_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirstOrThrow();
      
    return this.mapPrepLog(row);
  }

  async listPrepLogs(restaurantId: RestaurantId, limit: number = 50, offset: number = 0): Promise<PrepProductionLog[]> {
    const rows = await this.db
      .selectFrom('prep_production_logs')
      .selectAll()
      .where('restaurant_id', '=', restaurantId)
      .orderBy('produced_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
      
    return rows.map(r => this.mapPrepLog(r));
  }
}
