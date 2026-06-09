import { Injectable, Inject } from '@nestjs/common';
import { DB_CLIENT } from '../core/core.symbols';
import { Kysely } from 'kysely';
import type { Database, FeatureFlag, FeatureFlagKey, RestaurantId } from '@ims/types';
import type { ISettingsRepository } from './interfaces/i-settings.repository';

@Injectable()
export class SettingsRepository implements ISettingsRepository {
  constructor(@Inject(DB_CLIENT) private readonly db: Kysely<Database>) {}

  async getFeatureFlag(restaurantId: RestaurantId, key: FeatureFlagKey): Promise<FeatureFlag | null> {
    const flag = await this.db
      .selectFrom('feature_flags')
      .selectAll()
      .where('restaurant_id', '=', restaurantId)
      .where('flag_key', '=', key)
      .executeTakeFirst();
    if (!flag) return null;
    return {
      id: flag.id,
      restaurantId: flag.restaurant_id as RestaurantId,
      flagKey: flag.flag_key,
      flagValue: flag.flag_value,
      createdAt: flag.created_at,
      updatedAt: flag.updated_at,
    };
  }

  async getAllFeatureFlags(restaurantId: RestaurantId): Promise<FeatureFlag[]> {
    const flags = await this.db
      .selectFrom('feature_flags')
      .selectAll()
      .where('restaurant_id', '=', restaurantId)
      .execute();
    return flags.map(flag => ({
      id: flag.id,
      restaurantId: flag.restaurant_id as RestaurantId,
      flagKey: flag.flag_key,
      flagValue: flag.flag_value,
      createdAt: flag.created_at,
      updatedAt: flag.updated_at,
    }));
  }

  async setFeatureFlag(restaurantId: RestaurantId, key: FeatureFlagKey, value: boolean): Promise<FeatureFlag> {
    const flag = await this.db
      .insertInto('feature_flags')
      .values({
        restaurant_id: restaurantId,
        flag_key: key,
        flag_value: value,
      })
      .onConflict(oc => oc.columns(['restaurant_id', 'flag_key']).doUpdateSet({
        flag_value: value,
        updated_at: new Date().toISOString()
      }))
      .returningAll()
      .executeTakeFirstOrThrow();
    
    return {
      id: flag.id,
      restaurantId: flag.restaurant_id as RestaurantId,
      flagKey: flag.flag_key,
      flagValue: flag.flag_value,
      createdAt: flag.created_at,
      updatedAt: flag.updated_at,
    };
  }
}
