import { DB_CLIENT } from '../core/core.symbols';
import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { randomUUID } from 'crypto';
import { Database, RestaurantId, ItemId, StockLevel, asItemId } from '@ims/types';
import { ILedgerRepository } from './interfaces/i-ledger.repository';

@Injectable()
export class LedgerRepository implements ILedgerRepository {
  constructor(@Inject(DB_CLIENT) private readonly db: Kysely<Database>) {}

  async insertEntry(trx: unknown, entry: Record<string, unknown>): Promise<void> {
    const db = trx as Kysely<Database>;
    await db
      .insertInto('inventory_ledger')
      .values({
        id: randomUUID() as import('@ims/types').LedgerEntryId,
        restaurant_id: entry.restaurant_id as RestaurantId,
        item_id: entry.item_id as ItemId,
        change_amount: entry.change_amount as number,
        reason_code: entry.reason_code as import('@ims/types').LedgerReasonCode,
        reference_id: (entry.reference_id as string | undefined) ?? null,
      })
      .execute();
  }

  async sumChangeAmount(restaurantId: RestaurantId, itemId: ItemId): Promise<number> {
    const result = await this.db
      .selectFrom('inventory_ledger')
      .select(({ fn }) => [
        fn.sum<number>('change_amount').as('total')
      ])
      .where('restaurant_id', '=', restaurantId)
      .where('item_id', '=', itemId)
      .executeTakeFirst();
      
    return Number(result?.total || 0);
  }

  async sumChangeAmountBulk(restaurantId: RestaurantId): Promise<any[]> {
    const results = await this.db
      .selectFrom('inventory_ledger as il')
      .select([
        'il.item_id',
        ({ fn }) => fn.sum<number>('il.change_amount').as('total')
      ])
      .where('il.restaurant_id', '=', restaurantId)
      .groupBy(['il.item_id'])
      .execute();
      
    return results.map(r => ({
      itemId: asItemId(r.item_id),
      qty: Number(r.total || 0)
    }));
  }

  async getLedgerEntries(restaurantId: RestaurantId, limit: number, offset: number): Promise<any[]> {
    return await this.db
      .selectFrom('inventory_ledger as il')
      .select([
        'il.id',
        'il.created_at',
        'il.reason_code',
        'il.change_amount',
        'il.reference_id',
        'il.item_id'
      ])
      .where('il.restaurant_id', '=', restaurantId)
      .orderBy('il.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  }
}
