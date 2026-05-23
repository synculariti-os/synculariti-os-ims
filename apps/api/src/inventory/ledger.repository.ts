import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { randomUUID } from 'crypto';
import { Database, RestaurantId, ItemId, StockLevel, asItemId } from '@ims/types';
import { ILedgerRepository } from './interfaces/i-ledger.repository';

@Injectable()
export class LedgerRepository implements ILedgerRepository {
  constructor(@Inject('DB_CLIENT') private readonly db: Kysely<Database>) {}

  async insertEntry(trx: unknown, entry: Record<string, unknown>): Promise<void> {
    const db = trx as Kysely<Database>;
    await db
      .insertInto('inventory_ledger')
      .values({
        id: randomUUID() as any,
        restaurant_id: entry.restaurant_id as RestaurantId,
        item_id: entry.item_id as ItemId,
        change_amount: entry.change_amount as number,
        reason_code: entry.reason_code as any,
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

  async sumChangeAmountBulk(restaurantId: RestaurantId): Promise<StockLevel[]> {
    const results = await this.db
      .selectFrom('inventory_ledger')
      .select(['item_id', ({ fn }) => fn.sum<number>('change_amount').as('total')])
      .where('restaurant_id', '=', restaurantId)
      .groupBy('item_id')
      .execute();
      
    return results.map(r => ({
      itemId: asItemId(r.item_id),
      qty: Number(r.total || 0)
    }));
  }
}
